import type { EmployeePosition, UserRole } from './types'

/**
 * Helper functions para verificar permisos basados en employee_position
 */

// Definir permisos por posición
export const POSITION_PERMISSIONS = {
  barbero: {
    canRegisterAppointments: true,
    canRegisterSales: true,
    canViewReports: false,
    canManageInventory: false,
    canManageFinances: false,
    canManagePurchases: false,
    description: 'Puede registrar citas y ventas'
  },
  dueno: {
    canRegisterAppointments: true,
    canRegisterSales: true,
    canViewReports: true,
    canManageInventory: true,
    canManageFinances: true,
    canManagePurchases: true,
    description: 'Acceso completo: contabilidad, compras, inventario'
  },
  recepcionista: {
    canRegisterAppointments: true,
    canRegisterSales: false,
    canViewReports: false,
    canManageInventory: true,
    canManageFinances: false,
    canManagePurchases: false,
    description: 'Puede registrar citas y apoyar en limpieza ligera'
  }
} as const

/**
 * Verifica si un empleado puede registrar citas
 */
export function canRegisterAppointments(position?: EmployeePosition): boolean {
  if (!position) return false
  return POSITION_PERMISSIONS[position].canRegisterAppointments
}

/**
 * Verifica si un empleado puede registrar ventas
 */
export function canRegisterSales(position?: EmployeePosition): boolean {
  if (!position) return false
  return POSITION_PERMISSIONS[position].canRegisterSales
}

/**
 * Verifica si un empleado puede ver reportes
 */
export function canViewReports(position?: EmployeePosition): boolean {
  if (!position) return false
  return POSITION_PERMISSIONS[position].canViewReports
}

/**
 * Verifica si un empleado puede gestionar inventario
 */
export function canManageInventory(position?: EmployeePosition): boolean {
  if (!position) return false
  return POSITION_PERMISSIONS[position].canManageInventory
}

/**
 * Verifica si un empleado puede gestionar finanzas
 */
export function canManageFinances(position?: EmployeePosition): boolean {
  if (!position) return false
  return POSITION_PERMISSIONS[position].canManageFinances
}

/**
 * Verifica si un empleado puede gestionar compras
 */
export function canManagePurchases(position?: EmployeePosition): boolean {
  if (!position) return false
  return POSITION_PERMISSIONS[position].canManagePurchases
}

/**
 * Obtiene la descripción de una posición
 */
export function getPositionDescription(position?: EmployeePosition): string {
  if (!position) return 'Sin posición asignada'
  return POSITION_PERMISSIONS[position].description
}

/**
 * Obtiene todos los permisos de una posición
 */
export function getPositionPermissions(position?: EmployeePosition) {
  if (!position) return null
  return POSITION_PERMISSIONS[position]
}

/**
 * Obtiene el badge visual para una posición
 */
export function getPositionBadge(position?: EmployeePosition) {
  const badges = {
    barbero: { emoji: '✂️', text: 'Barbero', bg: '#dbeafe', color: '#1e40af' },
    dueno: { emoji: '👔', text: 'Dueño', bg: '#fef3c7', color: '#92400e' },
    recepcionista: { emoji: '📞', text: 'Asistente', bg: '#e0e7ff', color: '#3730a3' }
  }
  
  if (!position) {
    return { emoji: '❓', text: 'Sin asignar', bg: '#f1f5f9', color: '#64748b' }
  }
  
  return badges[position]
}

/**
 * Verifica si el usuario tiene acceso admin completo
 */
export function hasAdminAccess(role: UserRole, position?: EmployeePosition): boolean {
  return role === 'admin' || position === 'dueno'
}
