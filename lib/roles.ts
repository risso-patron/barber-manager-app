import { createClient } from '@/lib/supabase/client'

export type UserRole = 'admin' | 'employee' | 'client'

export interface UserWithRole {
  id: string
  email: string
  role: UserRole
  name: string
}

/**
 * Obtiene el rol del usuario actual
 */
export async function getCurrentUserRole(): Promise<UserWithRole | null> {
  const supabase = createClient()
  
  // Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Buscar usuario por email
  const { data: userData } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('email', user.email)
    .single()

  if (!userData) return null

  // Solo permitir roles admin y employee (no client)
  if (userData.role === 'client') return null

  return {
    id: userData.id,
    email: userData.email,
    role: userData.role as UserRole,
    name: userData.name
  }
}

/**
 * Verifica si el usuario actual es admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUserRole()
  return user?.role === 'admin'
}

/**
 * Verifica si el usuario actual es empleado
 */
export async function isEmployee(): Promise<boolean> {
  const user = await getCurrentUserRole()
  return user?.role === 'employee'
}

/**
 * Obtiene la ruta de dashboard según el rol
 */
export function getDashboardRoute(role: UserRole): string {
  return role === 'admin' ? '/admin' : '/employee'
}
