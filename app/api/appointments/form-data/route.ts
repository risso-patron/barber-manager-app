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

  const [
    { data: clients },
    { data: employees },
    { data: services },
  ] = await Promise.all([
    admin.from("users").select("id, name, phone").eq("role", "client").order("name"),
    admin.from("users").select("id, name, phone").eq("role", "employee").order("name"),
    admin.from("services").select("id, name, price, duration").eq("is_active", true).order("name"),
  ])

  return NextResponse.json({ clients: clients ?? [], employees: employees ?? [], services: services ?? [] })
}