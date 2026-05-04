import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Admin client bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  // Verify the caller is an admin
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { data: caller } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (caller?.role !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await request.json()
  const { name, email, phone, role, specialty, avatar_url } = body

  if (!name || !email || !phone || !role) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  // Create auth user with a temporary password
  const tempPassword = `Barber${Math.random().toString(36).slice(2, 10)}!`
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Insert public.users profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .insert({
      id: authData.user.id,
      name,
      email,
      phone,
      role,
      specialty: specialty || null,
      avatar_url: avatar_url || null,
    })
    .select()
    .single()

  if (profileError) {
    // Rollback: delete the auth user
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ employee: profile, tempPassword })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  // Verify admin
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { data: caller } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (caller?.role !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  // Delete auth user (cascades to public.users if FK set, else delete manually)
  await supabaseAdmin.from("users").delete().eq("id", id)
  await supabaseAdmin.auth.admin.deleteUser(id)

  return NextResponse.json({ ok: true })
}
