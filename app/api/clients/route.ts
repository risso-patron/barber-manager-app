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

export async function POST(request: Request) {
  const role = await getCallerRole()
  if (role !== "admin")
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { name, phone, email } = await request.json()
  if (!name || !phone)
    return NextResponse.json({ error: "Nombre y teléfono requeridos" }, { status: 400 })

  const admin = createAdminSupabaseClient()
  const tempEmail = email || `${phone.replace(/\D/g, "")}@guest.barber`

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: tempEmail,
    email_confirm: true,
    user_metadata: { name },
  })
  if (authError)
    return NextResponse.json({ error: authError.message }, { status: 400 })

  const { data: client, error: profileError } = await admin
    .from("users")
    .insert({ id: authData.user.id, name, email: tempEmail, phone, role: "client" })
    .select()
    .single()

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ client })
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
  await admin.from("users").delete().eq("id", id)
  await admin.auth.admin.deleteUser(id)

  return NextResponse.json({ ok: true })
}