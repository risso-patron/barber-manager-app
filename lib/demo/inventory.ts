/**
 * Demo inventory catalog
 * Source: demo-appointments.ts (only source)
 */

import type { InventoryItem } from "./types"

/**
 * Inventory items for the demo barbershop
 */
export const DEMO_INVENTORY: InventoryItem[] = [
  {
    id: 'i1',
    name: 'Shampoo Profesional',
    category: 'producto',
    quantity: 25,
    minStock: 10,
    price: 18.50,
    salePrice: 28.00,
    sku: 'SH-001',
    supplier: 'Beauty Supply Co.',
    lastRestocked: '2024-11-15',
    status: 'disponible'
  },
  {
    id: 'i2',
    name: 'Cera para Cabello',
    category: 'producto',
    quantity: 8,
    minStock: 10,
    price: 12.00,
    salePrice: 20.00,
    sku: 'CW-002',
    supplier: 'Hair Products Inc.',
    lastRestocked: '2024-11-10',
    status: 'bajo'
  },
  {
    id: 'i3',
    name: 'Tijeras Profesionales',
    category: 'herramienta',
    quantity: 15,
    minStock: 5,
    price: 45.00,
    salePrice: null,
    sku: 'TJ-003',
    supplier: 'Pro Tools Ltd.',
    lastRestocked: '2024-10-20',
    status: 'disponible'
  },
  {
    id: 'i4',
    name: 'Máquina de Afeitar',
    category: 'herramienta',
    quantity: 12,
    minStock: 8,
    price: 85.00,
    salePrice: null,
    sku: 'MA-004',
    supplier: 'Barber Equipment',
    lastRestocked: '2024-11-01',
    status: 'disponible'
  },
  {
    id: 'i5',
    name: 'Toallas Desechables',
    category: 'suministro',
    quantity: 0,
    minStock: 20,
    price: 15.00,
    salePrice: null,
    sku: 'TD-005',
    supplier: 'Clean Supplies',
    lastRestocked: '2024-10-15',
    status: 'agotado'
  },
  {
    id: 'i6',
    name: 'Cuchillas de Repuesto',
    category: 'suministro',
    quantity: 50,
    minStock: 30,
    price: 8.50,
    salePrice: null,
    sku: 'CR-006',
    supplier: 'Blade Masters',
    lastRestocked: '2024-11-20',
    status: 'disponible'
  },
  {
    id: 'i7',
    name: 'Gel de Afeitar',
    category: 'producto',
    quantity: 18,
    minStock: 12,
    price: 9.75,
    salePrice: 16.00,
    sku: 'GA-007',
    supplier: 'Hair Products Inc.',
    lastRestocked: '2024-11-18',
    status: 'disponible'
  },
  {
    id: 'i8',
    name: 'Aceite para Barba',
    category: 'producto',
    quantity: 6,
    minStock: 8,
    price: 22.00,
    salePrice: 35.00,
    sku: 'AB-008',
    supplier: 'Beauty Supply Co.',
    lastRestocked: '2024-11-05',
    status: 'bajo'
  }
]
