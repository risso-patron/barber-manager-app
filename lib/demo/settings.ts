/**
 * Demo mode detection and configuration settings
 */

/**
 * Detect if the application is running in demo mode
 * Demo mode is enabled when Supabase URL is not configured or contains 'demo'
 */
export const isDemoMode = () => {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL ||
         process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')
}

/**
 * localStorage keys used by the demo mode
 */
export const STORAGE_KEYS = {
  AUTH_USER: 'barber_manager_auth_user',
  APPOINTMENTS: 'barber_manager_appointments',
  USER_CONSENT: 'barber_manager_user_consent',
  THEME: 'barber_manager_theme'
} as const

/**
 * Demo mode welcome message with available credentials
 */
export const DEMO_MODE_MESSAGE = `
🎭 Modo Demo Activado

Estás usando Barber Manager en modo demostración.
Los datos se guardan localmente y no requieren base de datos.

Usuarios de prueba:
• Admin: admin@demo.com / Demo1234
• Empleado: employee@demo.com / Demo1234 (también barber@demo.com)
• Cliente: client@demo.com / Demo1234

Para usar en producción, configura Supabase en .env.local
`
