import { createClient } from '@/lib/supabase/client'

export type UserRole = 'admin' | 'employee'

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

  // Buscar empleado por email
  const { data: employee } = await supabase
    .from('employees')
    .select('id, name, email, role')
    .eq('email', user.email)
    .single()

  if (!employee) return null

  return {
    id: employee.id,
    email: employee.email,
    role: employee.role || 'employee',
    name: employee.name
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
