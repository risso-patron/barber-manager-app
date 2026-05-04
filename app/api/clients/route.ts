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
  // Verify the caller is authenticated
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { data: caller } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!caller || !["admin", "employee"].includes(caller.role)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const body = await request.json()
  const { name, phone, email: providedEmail } = body

  if (!name || !phone) {
    return NextResponse.json({ error: "Nombre y teléfono son requeridos" }, { status: 400 })
  }

  // Use provided email or derive a guest email from phone
  const guestEmail = providedEmail || `${phone.replace(/\D/g, "")}@guest.barber`
  const tempPassword = `Client${Math.random().toString(36).slice(2, 10)}!`

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: guestEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name, role: "client" },
  })

  if (authError) {
    // If user already exists, try to find existing client by email
    if (authError.message.includes("already been registered")) {
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id, name, phone")
        .eq("email", guestEmail)
        .single()
      if (existing) {
        return NextResponse.json({ client: existing })
      }
    }
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Insert public.users profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .insert({
      id: authData.user.id,
      name,
      email: guestEmail,
      phone,
      role: "client",
    })
    .select("id, name, phone, email")
    .single()

  if (profileError) {
    // Rollback auth user
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ client: profile })
}
