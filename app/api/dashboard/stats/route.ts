import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const admin = createAdminSupabaseClient()
  const today = new Date().toISOString().split("T")[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split("T")[0]

  const [
    { count: totalAppointments },
    { count: todayAppointments },
    { count: pendingAppointments },
    { count: totalEmployees },
    { count: totalClients },
    { count: newClientsMonth },
    { data: revenueData },
  ] = await Promise.all([
    admin.from("appointments").select("*", { count: "exact", head: true }),
    admin.from("appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today),
    admin.from("appointments").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("users").select("*", { count: "exact", head: true }).eq("role", "employee"),
    admin.from("users").select("*", { count: "exact", head: true }).eq("role", "client"),
    admin.from("users").select("*", { count: "exact", head: true }).eq("role", "client").gte("created_at", firstOfMonth),
    admin.from("appointments").select("service:services(price)").eq("status", "completed").gte("appointment_date", firstOfMonth),
  ])

  interface RevenueRow { service: { price: number | null } | null }
  const monthlyRevenue = ((revenueData ?? []) as unknown as RevenueRow[])
    .reduce((sum, r) => sum + (r.service?.price ?? 0), 0)

  return NextResponse.json({
    totalAppointments:  totalAppointments  ?? 0,
    todayAppointments:  todayAppointments  ?? 0,
    pendingAppointments: pendingAppointments ?? 0,
    totalEmployees:     totalEmployees     ?? 0,
    activeEmployees:    totalEmployees     ?? 0,
    totalClients:       totalClients       ?? 0,
    newClientsMonth:    newClientsMonth    ?? 0,
    monthlyRevenue,
  })
}