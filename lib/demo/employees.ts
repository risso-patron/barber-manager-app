/**
 * Demo employees catalog
 * Merged from demo-config.ts (3 employees) + demo-appointments.ts (Sofía Ramírez)
 * Using richer schema with specialties, rating, and isActive fields
 */

import type { Employee } from "./types"

/**
 * Employee roster for the demo barbershop
 *
 * Schema: Uses demo-config structure (specialties, rating, isActive)
 * Content: All 4 unique employees merged
 *
 * Note: Sofía Ramírez (demo-employee-001) exists in DEMO_USERS
 * and is the canonical "employee@demo.com" login account
 */
export const DEMO_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    name: 'Carlos Martínez',
    email: 'barber@demo.com',
    role: 'employee',
    phone: '+1234567891',
    specialties: ['Cortes clásicos', 'Barbería tradicional'],
    rating: 4.9,
    isActive: true
  },
  {
    id: 'emp-002',
    name: 'María García',
    email: 'maria@barberia.com',
    role: 'employee',
    phone: '+1234567893',
    specialties: ['Cortes modernos', 'Diseños'],
    rating: 4.8,
    isActive: true
  },
  {
    id: 'emp-003',
    name: 'Pedro López',
    email: 'pedro@barberia.com',
    role: 'employee',
    phone: '+1234567894',
    specialties: ['Barbería clásica', 'Afeitado'],
    rating: 4.7,
    isActive: true
  },
  {
    id: 'demo-employee-001',
    name: 'Sofía Ramírez',
    email: 'employee@demo.com',
    role: 'employee',
    phone: '+1234567895',
    specialties: ['Cortes modernos', 'Técnicas avanzadas'],
    rating: 4.9,
    isActive: true
  }
]

/**
 * Get employee by ID
 */
export function getEmployeeById(id: string): Employee | undefined {
  return DEMO_EMPLOYEES.find(e => e.id === id)
}
