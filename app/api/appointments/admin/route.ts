import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { z } from "zod"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

const appointmentAdminSchema = z.object({
  client_id:        z.string().uuid(),
  barber_id:        z.string().uuid(),
  service_id:       z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  status:           z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  notes:            z.string().max(500).optional(),
})

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { data: caller } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!caller || !["admin", "manager", "employee"].includes(caller.role)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = appointmentAdminSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { client_id, barber_id, service_id, appointment_date, appointment_time, status, notes } = parsed.data

  let supabaseAdmin: ReturnType<typeof createAdminSupabaseClient>
  try {
    supabaseAdmin = createAdminSupabaseClient()
  } catch (err) {
    console.error('[appointments/admin] Admin client init failed:', err)
    const msg = err instanceof Error ? err.message : 'Error de configuración del servidor'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert({ client_id, barber_id, service_id, appointment_date, appointment_time, status: status ?? "pending", notes: notes ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ appointment: data })
}
