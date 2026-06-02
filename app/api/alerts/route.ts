import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server"
import { withRateLimit, strictLimiter } from "@/lib/rate-limit"
import { isDemoMode } from "@/lib/demo-config"
import { z } from "zod"

const resolveSchema = z.object({ is_resolved: z.literal(true) })

// ---------- Demo data -------------------------------------------------------

const DEMO_ALERTS = [
  {
    id: "demo-alert-1",
    appointment_id: "apt-1",
    rating: 1,
    review_text: "Mala atención, llegué puntual y esperé 40 minutos.",
    is_resolved: false,
    created_at: new Date(Date.now() - 7200_000).toISOString(),
    client: { id: "c1", name: "Ana Torres" },
    employee: { id: "e1", name: "Carlos Pérez" },
  },
  {
    id: "demo-alert-2",
    appointment_id: "apt-2",
    rating: 2,
    review_text: null,
    is_resolved: false,
    created_at: new Date(Date.now() - 86400_000).toISOString(),
    client: { id: "c2", name: "Pedro Salas" },
    employee: { id: "e2", name: "María García" },
  },
]

// ---------- GET /api/alerts?resolved=false ----------------------------------

export async function GET(request: NextRequest) {
  return withRateLimit(request, strictLimiter, async () => {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (!["admin", "manager"].includes(profile?.role ?? "")) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    if (isDemoMode()) return NextResponse.json({ alerts: DEMO_ALERTS, total: DEMO_ALERTS.length })

    const showResolved = new URL(request.url).searchParams.get("resolved") === "true"

    const admin = createAdminSupabaseClient()
    const query = admin
      .from("low_rating_alerts")
      .select(`
        id, appointment_id, rating, review_text, is_resolved, resolved_at, created_at,
        client:users!low_rating_alerts_client_id_fkey(id, name),
        employee:users!low_rating_alerts_employee_id_fkey(id, name)
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    const { data, error } = showResolved ? await query : await query.eq("is_resolved", false)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ alerts: data ?? [], total: data?.length ?? 0 })
  })
}

// ---------- PATCH /api/alerts?id=<uuid> — mark resolved ---------------------

export async function PATCH(request: NextRequest) {
  return withRateLimit(request, strictLimiter, async () => {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (!["admin", "manager"].includes(profile?.role ?? "")) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const alertId = new URL(request.url).searchParams.get("id")
    if (!alertId) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    const body: unknown = await request.json()
    const parsed = resolveSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

    if (isDemoMode()) return NextResponse.json({ success: true })

    const admin = createAdminSupabaseClient()
    const { error } = await admin
      .from("low_rating_alerts")
      .update({ is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: user.id })
      .eq("id", alertId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  })
}
