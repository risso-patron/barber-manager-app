import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * GET /api/auth/callback
 *
 * Callback de Supabase Auth para flujos PKCE (recuperación de contraseña,
 * verificación de email, etc.).
 *
 * Supabase envía al usuario aquí con ?code=xxx.
 * Intercambiamos el code por una sesión y redirigimos a `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  // Asegurarnos de que `next` sea una ruta relativa (evitar open redirect)
  const safeNext = next.startsWith("/") ? next : "/dashboard"

  if (!code) {
    // Sin code → redirigir a login con mensaje de error
    return NextResponse.redirect(
      new URL(`/auth/login?message=${encodeURIComponent("Enlace inválido o expirado.")}`, origin)
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(
      new URL(`/auth/login?message=${encodeURIComponent("Error de configuración del servidor.")}`, origin)
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Error exchanging code for session:", error.message)
    return NextResponse.redirect(
      new URL(
        `/auth/login?message=${encodeURIComponent("El enlace expiró o ya fue usado. Solicita uno nuevo.")}`,
        origin
      )
    )
  }

  return NextResponse.redirect(new URL(safeNext, origin))
}
