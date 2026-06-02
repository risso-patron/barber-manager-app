// supabase/functions/process-notification-queue/index.ts
//
// Edge Function — Procesa la cola de notificaciones pendientes.
//
// DESPLIEGUE:
//   supabase functions deploy process-notification-queue
//
// TRIGGER recomendado (Supabase Dashboard → Database Webhooks):
//   Tabla: notification_queue  |  Evento: INSERT
//   URL: https://<project>.supabase.co/functions/v1/process-notification-queue
//
// Variables de entorno requeridas (Supabase Dashboard → Settings → Edge Functions):
//   SUPABASE_URL              — se inyecta automáticamente
//   SUPABASE_SERVICE_ROLE_KEY — se inyecta automáticamente
//   RESEND_API_KEY            — (Item 19) para envío de emails vía Resend
//   TWILIO_ACCOUNT_SID        — (Item 19) para envío de SMS vía Twilio
//   TWILIO_AUTH_TOKEN         — (Item 19)
//   TWILIO_PHONE_NUMBER       — (Item 19) número origen Twilio

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const BATCH_SIZE = 10
const MAX_ATTEMPTS = 3

interface NotificationRow {
  id: string
  type: string
  recipient_phone: string | null
  recipient_email: string | null
  recipient_name: string | null
  message_sms: string | null
  message_email: string | null
  subject_email: string | null
  attempts: number
  metadata: Record<string, unknown> | null
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  // Obtener notificaciones pendientes con menos de MAX_ATTEMPTS intentos
  const { data: pending, error: fetchError } = await supabase
    .from("notification_queue")
    .select("id, type, recipient_phone, recipient_email, recipient_name, message_sms, message_email, subject_email, attempts, metadata")
    .eq("status", "pending")
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE)

  if (fetchError) {
    console.error("[notify-queue] Error fetching pending:", fetchError)
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }

  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ processed: 0, failed: 0, total: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  let processed = 0
  let failed = 0

  for (const notification of pending as NotificationRow[]) {
    // Marcar como en proceso para evitar doble procesamiento
    await supabase
      .from("notification_queue")
      .update({ status: "processing", attempts: notification.attempts + 1 })
      .eq("id", notification.id)

    try {
      await processNotification(notification)

      await supabase
        .from("notification_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", notification.id)

      processed++
    } catch (err) {
      console.error(`[notify-queue] Failed ${notification.id}:`, err)
      const isFinal = notification.attempts + 1 >= MAX_ATTEMPTS

      await supabase
        .from("notification_queue")
        .update({
          status: isFinal ? "failed" : "pending",
          error_message: String(err),
        })
        .eq("id", notification.id)

      failed++
    }
  }

  return new Response(
    JSON.stringify({ processed, failed, total: pending.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  )
})

async function processNotification(n: NotificationRow): Promise<void> {
  const errors: string[] = []

  // ── EMAIL via Resend ──────────────────────────────────────────────────────
  const resendKey = Deno.env.get("RESEND_API_KEY")
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@resend.dev"

  if (n.recipient_email && n.message_email && resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Ornō Barbershop <${fromEmail}>`,
        to: n.recipient_email,
        subject: n.subject_email ?? "Notificación de tu cita",
        text: n.message_email,
      }),
    })
    if (!res.ok) {
      const detail = await res.text()
      errors.push(`Resend: ${detail}`)
      console.error(`[notify-queue] Resend error (${n.id}):`, detail)
    } else {
      console.log(`[notify-queue] Email enviado a ${n.recipient_email}`)
    }
  } else if (n.recipient_email && !resendKey) {
    console.warn("[notify-queue] RESEND_API_KEY no configurada — email omitido")
  }

  // ── WhatsApp via Twilio ───────────────────────────────────────────────────
  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID")
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN")
  const twilioFrom = Deno.env.get("TWILIO_WHATSAPP_FROM") // formato: whatsapp:+1234567890

  if (n.recipient_phone && n.message_sms && twilioSid && twilioToken && twilioFrom) {
    // Normalizar número de destino al formato WhatsApp de Twilio
    const toNumber = n.recipient_phone.startsWith("whatsapp:")
      ? n.recipient_phone
      : `whatsapp:${n.recipient_phone}`

    const body = new URLSearchParams({
      From: twilioFrom,
      To: toNumber,
      Body: n.message_sms,
    })
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: { Authorization: "Basic " + btoa(`${twilioSid}:${twilioToken}`) },
        body,
      }
    )
    if (!res.ok) {
      const detail = await res.text()
      errors.push(`Twilio: ${detail}`)
      console.error(`[notify-queue] Twilio error (${n.id}):`, detail)
    } else {
      console.log(`[notify-queue] WhatsApp enviado a ${n.recipient_phone}`)
    }
  } else if (n.recipient_phone && !(twilioSid && twilioToken && twilioFrom)) {
    console.warn("[notify-queue] Twilio no configurado — WhatsApp omitido")
  }

  // Si ambos canales fallaron con error (no solo omitidos), propagar
  if (errors.length > 0) {
    throw new Error(errors.join(" | "))
  }
}
