/**
 * Demo user accounts for authentication
 */

import type { DemoUser } from "./types"

/**
 * Demo users with login credentials
 *
 * These accounts are used for demo mode authentication.
 * All passwords are: Demo1234
 */
export const DEMO_USERS: Record<string, DemoUser> = {
  admin: {
    id: 'demo-admin-001',
    email: 'admin@demo.com',
    password: 'Demo1234',
    name: 'Admin Demo',
    role: 'admin',
    phone: '+1234567890',
    avatar_url: null
  },
  barber: {
    id: 'demo-barber-001',
    email: 'barber@demo.com',
    password: 'Demo1234',
    name: 'Carlos Martínez',
    role: 'employee',
    phone: '+1234567891',
    avatar_url: null
  },
  employee: {
    id: 'demo-employee-001',
    email: 'employee@demo.com',
    password: 'Demo1234',
    name: 'Sofía Ramírez',
    role: 'employee',
    phone: '+1234567895',
    avatar_url: null
  },
  client: {
    id: 'demo-client-001',
    email: 'client@demo.com',
    password: 'Demo1234',
    name: 'Juan Pérez',
    role: 'client',
    phone: '+1234567892',
    avatar_url: null
  },
  vincent: {
    id: 'demo-client-002',
    email: 'vincent@ornodemo.com',
    password: 'Demo1234',
    name: 'Vincent',
    role: 'client',
    phone: '+1234567894',
    avatar_url: null
  }
}
