import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
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
 * Encola una notificación para envío asíncrono por el cron de Vercel
 * (/api/cron/send-reminders — NotificationProcessor, ADR-028).
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })

    const { data: caller } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (caller?.role !== "admin")
      return NextResponse.json({ success: false, error: "Sin permisos" }, { status: 403 })

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

    const supabaseAdmin = createAdminSupabaseClient()

    const { data, error } = await supabaseAdmin
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
