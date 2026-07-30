import { NextResponse } from "next/server"
import { withRateLimit, loginLimiter } from "@/lib/rate-limit"
import { forgotPasswordSchema } from "@/lib/schemas"
import { isDemoMode } from "@/lib/demo"
import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * POST /api/auth/forgot-password
 *
 * Inicia el flujo de recuperación de contraseña para admin y client.
 * Empleados usan reseteo manual del admin.
 *
 * Seguridad:
 * - Siempre responde 200 aunque el email no exista (evita enumeración de usuarios).
 * - Rate limiting con loginLimiter.
 * - Solo roles admin y client pueden usar este flujo.
 */
export async function POST(request: Request) {
  return withRateLimit(request, loginLimiter, async () => {
    try {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
      }

      const parsed = forgotPasswordSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Email inválido", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const { email } = parsed.data

      // MODO DEMO — simular sin persistir
      if (isDemoMode()) {
        return NextResponse.json({
          success: true,
          message:
            "Si este email está registrado recibirás un enlace de recuperación. (modo demo: no se envía email real)",
        })
      }

      const supabase = await createServerSupabaseClient()

      // Verificar que el email corresponde a un admin o client (no employee)
      const { createAdminSupabaseClient } = await import("@/lib/supabase/server")
      const adminClient = createAdminSupabaseClient()

      const { data: userProfile } = await adminClient
        .from("users")
        .select("role")
        .eq("email", email)
        .maybeSingle()

      // Si es employee, rechazamos silenciosamente (respuesta idéntica a éxito)
      if (userProfile?.role === "employee") {
        return NextResponse.json({
          success: true,
          message:
            "Si este email está registrado recibirás un enlace de recuperación.",
        })
      }

      const origin = new URL(request.url).origin
      const redirectTo = `${origin}/api/auth/callback?next=/auth/reset-password`

      await supabase.auth.resetPasswordForEmail(email, { redirectTo })

      // Respuesta siempre idéntica para no revelar si el email existe
      return NextResponse.json({
        success: true,
        message: "Si este email está registrado recibirás un enlace de recuperación.",
      })
    } catch (error) {
      console.error("Error en POST /api/auth/forgot-password:", error)
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
  })
}
