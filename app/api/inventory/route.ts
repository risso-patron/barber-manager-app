import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

async function getCallerRole() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single()
  return data?.role ?? null
}

export async function DELETE(request: Request) {
  const role = await getCallerRole()
  if (role !== "admin")
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id)
    return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("inventory").delete().eq("id", id)
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}