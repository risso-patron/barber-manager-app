/**
 * Demo clients catalog
 * Source: demo-appointments.ts (only source)
 */

import type { Client } from "./types"

/**
 * Client profiles for the demo barbershop
 */
export const DEMO_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Pedro Martínez',
    email: 'pedro@email.com',
    phone: '555-1001',
    createdAt: '2024-01-15',
    isActive: true
  },
  {
    id: 'c2',
    name: 'Ana Rodríguez',
    email: 'ana@email.com',
    phone: '555-1002',
    createdAt: '2024-02-20',
    isActive: true
  },
  {
    id: 'c3',
    name: 'Luis Fernández',
    email: 'luis@email.com',
    phone: '555-1003',
    createdAt: '2024-03-10',
    isActive: true
  },
  {
    id: 'c4',
    name: 'Carmen Sánchez',
    email: 'carmen@email.com',
    phone: '555-1004',
    createdAt: '2024-10-05',
    isActive: true
  },
  {
    id: 'c5',
    name: 'Miguel Torres',
    email: 'miguel@email.com',
    phone: '555-1005',
    createdAt: '2024-11-12',
    isActive: true
  }
]

/**
 * Get client by ID
 */
export function getClientById(id: string): Client | undefined {
  return DEMO_CLIENTS.find(c => c.id === id)
}
