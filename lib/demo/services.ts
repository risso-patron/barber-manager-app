/**
 * Demo services catalog
 * Merged from demo-config.ts (5 services) + demo-appointments.ts (Tinte)
 * Using richer schema with category and isActive fields
 */

import type { Service } from "./types"

/**
 * Available services in the demo barbershop
 *
 * Schema: Uses demo-config structure (category, isActive)
 * Pricing: Uses demo-config canonical pricing
 * Content: Includes all 6 unique services from both sources
 */
export const DEMO_SERVICES: Service[] = [
  {
    id: 'service-001',
    name: 'Corte de Cabello',
    description: 'Corte profesional con técnicas modernas',
    price: 25,
    duration: 30,
    category: 'haircut',
    isActive: true
  },
  {
    id: 'service-002',
    name: 'Barba y Bigote',
    description: 'Arreglo completo de barba con toalla caliente',
    price: 20,
    duration: 25,
    category: 'beard',
    isActive: true
  },
  {
    id: 'service-003',
    name: 'Corte + Barba',
    description: 'Combo completo de corte y barba',
    price: 40,
    duration: 50,
    category: 'combo',
    isActive: true
  },
  {
    id: 'service-004',
    name: 'Corte Niño',
    description: 'Corte especial para niños menores de 12 años',
    price: 18,
    duration: 20,
    category: 'haircut',
    isActive: true
  },
  {
    id: 'service-005',
    name: 'Afeitado Clásico',
    description: 'Afeitado tradicional con navaja',
    price: 30,
    duration: 35,
    category: 'shave',
    isActive: true
  },
  {
    id: 'service-006',
    name: 'Tinte',
    description: 'Coloración completa',
    price: 35,
    duration: 60,
    category: 'other',
    isActive: true
  }
]

/**
 * Get service by ID
 */
export function getServiceById(id: string): Service | undefined {
  return DEMO_SERVICES.find(s => s.id === id)
}
