import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

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
  let supabaseAdmin: ReturnType<typeof createAdminSupabaseClient>
  try {
    supabaseAdmin = createAdminSupabaseClient()
  } catch (err) {
    console.error('[employees] Admin client init failed:', err)
    const msg = err instanceof Error ? err.message : 'Error de configuración del servidor'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // RH-003: on_auth_user_created ya crea la fila en public.users al
  // crearse el auth user — UPDATE la completa; INSERT solo si esa fila
  // no existe (0 filas afectadas por el UPDATE).
  const profileFields = {
    name,
    email,
    phone,
    role,
    specialty: specialty || null,
    avatar_url: avatar_url || null,
  }

  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from("users")
    .update(profileFields)
    .eq("id", authData.user.id)
    .select()
    .maybeSingle()

  if (updateError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  let profile = updatedProfile
  if (!profile) {
    const { data: insertedProfile, error: profileError } = await supabaseAdmin
      .from("users")
      .insert({ id: authData.user.id, ...profileFields })
      .select()
      .single()

    if (profileError) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }
    profile = insertedProfile
  }

  return NextResponse.json({ employee: profile, tempPassword })
}

export async function PATCH(request: Request) {
  // Reset password for an employee
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

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  let supabaseAdmin: ReturnType<typeof createAdminSupabaseClient>
  try {
    supabaseAdmin = createAdminSupabaseClient()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de configuración del servidor'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const newPassword = `Barber${Math.random().toString(36).slice(2, 10)}!`
  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: newPassword })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ tempPassword: newPassword })
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
  let supabaseAdmin: ReturnType<typeof createAdminSupabaseClient>
  try {
    supabaseAdmin = createAdminSupabaseClient()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de configuración del servidor'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
  await supabaseAdmin.from("users").delete().eq("id", id)
  await supabaseAdmin.auth.admin.deleteUser(id)

  return NextResponse.json({ ok: true })
}
