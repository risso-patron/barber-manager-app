import type { SupabaseClient } from "@supabase/supabase-js"

// NotificationProcessor (R-1, ADR-028): procesa la cola pendiente y realiza
// los envíos (Resend / Twilio, portado 1:1 de la ex edge function Deno).
// NO decide qué se genera — eso es responsabilidad de ReminderScheduler.

export interface QueueRow {
  id: string
  type: string
  tenant_id: string | null
  recipient_phone: string | null
  recipient_email: string | null
  recipient_name: string | null
  message_sms: string | null
  message_email: string | null
  subject_email: string | null
  attempts: number
  metadata: Record<string, unknown> | null
}

export interface DeliveryEnv {
  resendApiKey?: string
  resendFromEmail?: string
  twilioAccountSid?: string
  twilioAuthToken?: string
  twilioWhatsappFrom?: string
}

export interface DeliveryResult {
  email: "sent" | "skipped"
  whatsapp: "sent" | "skipped"
}

export interface QuotaDecision {
  allowed: boolean
  reason?: string
}

/**
 * Seam de cuotas: el pipeline NUNCA conoce planes, créditos ni suscripciones.
 * Solo pregunta si puede enviar. Toda la lógica de Billing vivirá detrás de
 * esta interfaz — implementarla no debe tocar nada más del pipeline.
 * tenant_id null = filas legadas anteriores al script 36.
 */
export async function canSendNotification(_tenantId: string | null): Promise<QuotaDecision> {
  return { allowed: true }
}

export function readDeliveryEnv(env: NodeJS.ProcessEnv = process.env): DeliveryEnv {
  return {
    resendApiKey: env.RESEND_API_KEY,
    resendFromEmail: env.RESEND_FROM_EMAIL,
    twilioAccountSid: env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: env.TWILIO_AUTH_TOKEN,
    twilioWhatsappFrom: env.TWILIO_WHATSAPP_FROM,
  }
}

/**
 * Envía una notificación por los canales que la fila y las credenciales
 * permitan. Canal sin credenciales o sin destinatario → omitido sin error.
 * Canal intentado que falla → throw (el llamador decide reintento/failed).
 */
export async function deliverNotification(
  n: QueueRow,
  env: DeliveryEnv,
  fetchFn: typeof fetch = fetch
): Promise<DeliveryResult> {
  const errors: string[] = []
  const result: DeliveryResult = { email: "skipped", whatsapp: "skipped" }

  // ── Email vía Resend ────────────────────────────────────────────────────
  if (n.recipient_email && n.message_email && env.resendApiKey) {
    const fromEmail = env.resendFromEmail ?? "noreply@resend.dev"
    const res = await fetchFn("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Ornō <${fromEmail}>`,
        to: n.recipient_email,
        subject: n.subject_email ?? "Notificación de tu cita",
        text: n.message_email,
      }),
    })
    if (!res.ok) {
      errors.push(`Resend: ${await res.text()}`)
    } else {
      result.email = "sent"
    }
  } else if (n.recipient_email && n.message_email) {
    console.warn("[notifications] RESEND_API_KEY no configurada — email omitido")
  }

  // ── WhatsApp vía Twilio ─────────────────────────────────────────────────
  const twilioReady = env.twilioAccountSid && env.twilioAuthToken && env.twilioWhatsappFrom
  if (n.recipient_phone && n.message_sms && twilioReady) {
    const toNumber = n.recipient_phone.startsWith("whatsapp:")
      ? n.recipient_phone
      : `whatsapp:${n.recipient_phone}`
    const body = new URLSearchParams({
      From: env.twilioWhatsappFrom as string,
      To: toNumber,
      Body: n.message_sms,
    })
    const res = await fetchFn(
      `https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString("base64"),
        },
        body: body.toString(),
      }
    )
    if (!res.ok) {
      errors.push(`Twilio: ${await res.text()}`)
    } else {
      result.whatsapp = "sent"
    }
  } else if (n.recipient_phone && n.message_sms) {
    console.warn("[notifications] Twilio no configurado — WhatsApp omitido")
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" | "))
  }
  return result
}

/**
 * Reclamo por compare-and-swap: solo envía el worker que efectivamente
 * transicionó la fila pending → processing (filas afectadas > 0).
 * N ejecuciones concurrentes del cron nunca duplican un envío.
 */
export async function claimNotification(
  db: SupabaseClient,
  id: string,
  currentAttempts: number,
  nowIso: string
): Promise<boolean> {
  const { data, error } = await db
    .from("notification_queue")
    .update({ status: "processing", attempts: currentAttempts + 1, processing_at: nowIso })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")

  if (error) {
    console.error(`[notifications] Error reclamando ${id}:`, error.message)
    return false
  }
  return (data?.length ?? 0) > 0
}

/**
 * Devuelve a la cola las filas atascadas en processing por un worker muerto:
 * con intentos restantes vuelven a pending (reintento en el próximo tick);
 * con los intentos agotados mueren como failed — nunca quedan zombies en
 * pending invisibles al fetch (que filtra attempts < maxAttempts).
 */
export async function reclaimStale(
  db: SupabaseClient,
  staleCutoffIso: string,
  maxAttempts: number
): Promise<void> {
  await db
    .from("notification_queue")
    .update({ status: "pending" })
    .eq("status", "processing")
    .lt("processing_at", staleCutoffIso)
    .lt("attempts", maxAttempts)

  await db
    .from("notification_queue")
    .update({
      status: "failed",
      error_message: "Reintentos agotados (worker interrumpido durante el envío)",
    })
    .eq("status", "processing")
    .lt("processing_at", staleCutoffIso)
    .gte("attempts", maxAttempts)
}

export interface ProcessQueueOptions {
  batchSize?: number
  maxAttempts?: number
  /** Minutos tras los cuales una fila atascada en processing vuelve a pending. */
  reclaimAfterMinutes?: number
  now?: Date
  env?: DeliveryEnv
  fetchFn?: typeof fetch
}

export interface ProcessQueueSummary {
  total: number
  sent: number
  failed: number
  skipped: number
}

/**
 * Procesa la cola pendiente: reclama, envía y marca estado. Reintentos hasta
 * maxAttempts (fallo intermedio vuelve a pending; el fallo final queda failed).
 */
export async function processQueue(
  db: SupabaseClient,
  options: ProcessQueueOptions = {}
): Promise<ProcessQueueSummary> {
  const {
    batchSize = 25,
    maxAttempts = 3,
    reclaimAfterMinutes = 15,
    now = new Date(),
    env = readDeliveryEnv(),
    fetchFn = fetch,
  } = options

  // Guard de reclamo: un worker muerto no puede dejar mensajes colgados.
  const staleCutoff = new Date(now.getTime() - reclaimAfterMinutes * 60_000).toISOString()
  await reclaimStale(db, staleCutoff, maxAttempts)

  const { data: pending, error } = await db
    .from("notification_queue")
    .select(
      "id, type, tenant_id, recipient_phone, recipient_email, recipient_name, message_sms, message_email, subject_email, attempts, metadata"
    )
    .eq("status", "pending")
    .lt("attempts", maxAttempts)
    .order("created_at", { ascending: true })
    .limit(batchSize)

  if (error) {
    throw new Error(`NotificationProcessor: error leyendo la cola: ${error.message}`)
  }

  const summary: ProcessQueueSummary = { total: pending?.length ?? 0, sent: 0, failed: 0, skipped: 0 }

  for (const row of (pending ?? []) as QueueRow[]) {
    const quota = await canSendNotification(row.tenant_id)
    if (!quota.allowed) {
      await db
        .from("notification_queue")
        .update({ status: "failed", error_message: quota.reason ?? "Cuota de envío excedida" })
        .eq("id", row.id)
      summary.skipped++
      continue
    }

    const claimed = await claimNotification(db, row.id, row.attempts, now.toISOString())
    if (!claimed) {
      summary.skipped++
      continue
    }

    try {
      await deliverNotification(row, env, fetchFn)
      await db
        .from("notification_queue")
        .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
        .eq("id", row.id)
      summary.sent++
    } catch (err) {
      const isFinal = row.attempts + 1 >= maxAttempts
      await db
        .from("notification_queue")
        .update({ status: isFinal ? "failed" : "pending", error_message: String(err) })
        .eq("id", row.id)
      summary.failed++
    }
  }

  return summary
}
