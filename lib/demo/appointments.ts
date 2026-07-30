/**
 * Demo appointments catalog with helper functions
 * Source: demo-appointments.ts with ID references updated to canonical data
 */

import type { Appointment, AppointmentStatus } from "./types"

// Generate dynamic dates for realistic appointments
const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

/**
 * Pre-generated appointments with various statuses and dates
 *
 * ID mappings updated to match canonical services and employees:
 * - Service IDs: s1-s5 → service-001 to service-006
 * - Employee IDs: e1-e3, demo-employee-001 → emp-001 to emp-003, demo-employee-001
 * - Service/Employee names updated to match canonical data
 */
export const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    clientId: 'c1',
    clientName: 'Pedro Martínez',
    clientPhone: '555-1001',
    employeeId: 'emp-001',
    employeeName: 'Carlos Martínez',
    serviceId: 'service-003',
    serviceName: 'Corte + Barba',
    date: today.toISOString().split('T')[0]!,
    time: '10:00',
    duration: 50,
    price: 40,
    status: 'confirmed',
    notes: 'Cliente prefiere corte bajo',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'a2',
    clientId: 'c2',
    clientName: 'Ana Rodríguez',
    clientPhone: '555-1002',
    employeeId: 'emp-002',
    employeeName: 'María García',
    serviceId: 'service-001',
    serviceName: 'Corte de Cabello',
    date: today.toISOString().split('T')[0]!,
    time: '11:30',
    duration: 30,
    price: 25,
    status: 'pending',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'a3',
    clientId: 'c3',
    clientName: 'Luis Fernández',
    clientPhone: '555-1003',
    employeeId: 'emp-001',
    employeeName: 'Carlos Martínez',
    serviceId: 'service-005',
    serviceName: 'Afeitado Clásico',
    date: today.toISOString().split('T')[0]!,
    time: '14:00',
    duration: 35,
    price: 30,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: 'a4',
    clientId: 'c4',
    clientName: 'Carmen Sánchez',
    clientPhone: '555-1004',
    employeeId: 'emp-003',
    employeeName: 'Pedro López',
    serviceId: 'service-006',
    serviceName: 'Tinte',
    date: tomorrow.toISOString().split('T')[0]!,
    time: '09:00',
    duration: 60,
    price: 35,
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'a5',
    clientId: 'c5',
    clientName: 'Miguel Torres',
    clientPhone: '555-1005',
    employeeId: 'emp-002',
    employeeName: 'María García',
    serviceId: 'service-004',
    serviceName: 'Corte Niño',
    date: tomorrow.toISOString().split('T')[0]!,
    time: '16:00',
    duration: 20,
    price: 18,
    status: 'confirmed',
    notes: 'Niño de 8 años',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'a6',
    clientId: 'c1',
    clientName: 'Pedro Martínez',
    clientPhone: '555-1001',
    employeeId: 'emp-001',
    employeeName: 'Carlos Martínez',
    serviceId: 'service-003',
    serviceName: 'Corte + Barba',
    date: new Date(Date.now() - 604800000).toISOString().split('T')[0]!,
    time: '10:00',
    duration: 50,
    price: 40,
    status: 'completed',
    createdAt: new Date(Date.now() - 1209600000).toISOString()
  },
  {
    id: 'a7',
    clientId: 'c3',
    clientName: 'Luis Fernández',
    clientPhone: '555-1003',
    employeeId: 'emp-002',
    employeeName: 'María García',
    serviceId: 'service-001',
    serviceName: 'Corte de Cabello',
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0]!,
    time: '15:00',
    duration: 30,
    price: 25,
    status: 'cancelled',
    notes: 'Cliente canceló por motivos personales',
    createdAt: new Date(Date.now() - 432000000).toISOString()
  },
  {
    id: 'a8',
    clientId: 'c4',
    clientName: 'Carmen Sánchez',
    clientPhone: '555-1004',
    employeeId: 'demo-employee-001',
    employeeName: 'Sofía Ramírez',
    serviceId: 'service-001',
    serviceName: 'Corte de Cabello',
    date: today.toISOString().split('T')[0]!,
    time: '09:30',
    duration: 30,
    price: 25,
    status: 'confirmed',
    notes: 'Prefiere lateral degradado',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'a9',
    clientId: 'c5',
    clientName: 'Miguel Torres',
    clientPhone: '555-1005',
    employeeId: 'demo-employee-001',
    employeeName: 'Sofía Ramírez',
    serviceId: 'service-005',
    serviceName: 'Afeitado Clásico',
    date: tomorrow.toISOString().split('T')[0]!,
    time: '12:00',
    duration: 35,
    price: 30,
    status: 'pending',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'a10',
    clientId: 'c2',
    clientName: 'Ana Rodríguez',
    clientPhone: '555-1002',
    employeeId: 'demo-employee-001',
    employeeName: 'Sofía Ramírez',
    serviceId: 'service-003',
    serviceName: 'Corte + Barba',
    date: new Date(Date.now() - 432000000).toISOString().split('T')[0]!,
    time: '11:00',
    duration: 50,
    price: 40,
    status: 'completed',
    createdAt: new Date(Date.now() - 950400000).toISOString()
  }
]

/**
 * Filter appointments by date
 */
export function getAppointmentsByDate(date: string): Appointment[] {
  return DEMO_APPOINTMENTS.filter(apt => apt.date === date)
}

/**
 * Filter appointments by status
 */
export function getAppointmentsByStatus(status: AppointmentStatus): Appointment[] {
  return DEMO_APPOINTMENTS.filter(apt => apt.status === status)
}

/**
 * Filter appointments by employee ID
 */
export function getAppointmentsByEmployee(employeeId: string): Appointment[] {
  return DEMO_APPOINTMENTS.filter(apt => apt.employeeId === employeeId)
}
