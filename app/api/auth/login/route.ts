import { NextResponse } from 'next/server'
import { withRateLimit, loginLimiter, getClientIP } from '@/lib/rate-limit'
import { validateEmail, validatePassword, isSQLInjectionAttempt } from '@/lib/validation'
import { isDemoMode } from '@/lib/demo-config'
import { logLoginSuccess, logLoginFailed, logSqlInjectionAttempt } from '@/lib/security-logger'

export async function POST(request: Request) {
  return withRateLimit(request, loginLimiter, async () => {
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || undefined

    try {
      const body = await request.json()
      const { email, password } = body

      // Detectar SQL injection attempts
      if (isSQLInjectionAttempt(email) || isSQLInjectionAttempt(password)) {
        logSqlInjectionAttempt(ip, '/api/auth/login', email)
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }

      // Validación de inputs
      const emailValidation = validateEmail(email)
      if (!emailValidation.valid) {
        return NextResponse.json(
          { error: emailValidation.error },
          { status: 400 }
        )
      }

      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        logLoginFailed(ip, email, userAgent)
        return NextResponse.json(
          { error: 'Credenciales inválidas' }, // No revelar detalles específicos
          { status: 401 }
        )
      }

      // MODO DEMO - Simulación de autenticación
      if (isDemoMode()) {
        const { DEMO_USERS } = await import('@/lib/demo-config')
        
        const user = Object.values(DEMO_USERS).find(
          u => u.email.toLowerCase() === email.toLowerCase()
        )

        if (user && password === user.password) {
          // Éxito - retornar datos del usuario (sin password)
          const { password: _, ...safeUser } = user
          
          // Log de login exitoso
          logLoginSuccess(ip, user.id, userAgent)
          
          return NextResponse.json({
            success: true,
            user: safeUser,
            token: `demo_token_${user.id}_${Date.now()}` // Token simulado
          })
        }

        // Credenciales incorrectas
        logLoginFailed(ip, email, userAgent)
        return NextResponse.json(
          { error: 'Email o contraseña incorrectos' },
          { status: 401 }
        )
      }

      // Autenticación real con Supabase
      const { createServerSupabaseClient } = await import('@/lib/supabase/server')
      const supabase = await createServerSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error || !data.user) {
        logLoginFailed(ip, email, userAgent)
        return NextResponse.json(
          { error: 'Email o contraseña incorrectos' },
          { status: 401 }
        )
      }

      logLoginSuccess(ip, data.user.id, userAgent)
      return NextResponse.json({ success: true, user: { id: data.user.id, email: data.user.email } })

    } catch (error) {
      console.error('Error en /api/auth/login:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  })
}
