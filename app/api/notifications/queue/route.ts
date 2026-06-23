import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

const EnqueueSchema = z
  .object({
    type: z.enum(["appointment_created", "reminder", "cancellation", "confirmation"]),
    recipient_phone: z.string().optional(),
    recipient_email: z.string().email("Email inválido").optional(),
    recipient_name: z.string().min(1),
    message_sms: z.string().optional(),
    message_email: z.string().optional(),
    subject_email: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((d) => d.recipient_phone || d.recipient_email, {
    message: "Se requiere al menos un canal: phone o email",
  })

/**
 * POST /api/notifications/queue
 * Encola una notificación para envío asíncrono por la Edge Function.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = EnqueueSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      )
    }

    // Demo mode: sin DB, responder como encolado
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.log("[notifications/queue] Demo mode — notificación simulada:", parsed.data.type)
      return NextResponse.json({ success: true, queued: true, id: `demo-${Date.now()}` })
    }

    const supabase = createAdminSupabaseClient()

    const { data, error } = await supabase
      .from("notification_queue")
      .insert(parsed.data)
      .select("id")
      .single()

    if (error) {
      console.error("[notifications/queue] Insert failed:", error)
      return NextResponse.json(
        { success: false, error: "Error encolando notificación" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, queued: true, id: data.id })
  } catch (err) {
    console.error("[notifications/queue] Unexpected error:", err)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}
