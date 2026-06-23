import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Activa la cuenta de un invitado que ya tiene un registro en auth.users (creado por
 * el booking API) pero sin contraseña.
 *
 * POST /api/auth/activate-account
 * Body: { phone, email, password }
 *
 * 1. Busca el usuario en public.users por teléfono
 * 2. Si el email guardado era el fake (@guest.barber) y el usuario provee uno real → lo actualiza
 * 3. Pone la contraseña con admin.updateUserById
 */
export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { phone, email, password } = await request.json()

    if (!phone || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      )
    }

    // Buscar usuario por teléfono (el booking API siempre guarda el teléfono)
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, email, name, role")
      .eq("phone", phone)
      .eq("role", "client")
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "No se encontró ninguna reserva con ese teléfono" },
        { status: 404 }
      )
    }

    const isFakeEmail = profile.email.endsWith("@guest.barber")
    const targetEmail = isFakeEmail ? email : profile.email

    // Actualizar auth.users: poner contraseña y, si aplica, email real
    const updatePayload: { password: string; email?: string } = { password }
    if (isFakeEmail) {
      updatePayload.email = email
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(
      profile.id,
      updatePayload
    )

    if (authError) {
      // Email ya registrado en otra cuenta
      if (authError.message?.includes("already")) {
        return NextResponse.json(
          { success: false, error: "Ese email ya está en uso. Intenta con otro o inicia sesión." },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: "Error activando la cuenta" },
        { status: 500 }
      )
    }

    // Si actualizamos el email, sincronizar public.users también
    if (isFakeEmail) {
      await supabase
        .from("users")
        .update({ email })
        .eq("id", profile.id)
    }

    return NextResponse.json({
      success: true,
      email: targetEmail,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
