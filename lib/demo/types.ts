/**
 * Type definitions for demo data domain
 */

export type UserRole = "admin" | "employee" | "client"

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"

export type ServiceCategory = "haircut" | "beard" | "combo" | "shave" | "other"

export type InventoryCategory = "producto" | "herramienta" | "suministro"

export type InventoryStatus = "disponible" | "bajo" | "agotado"

export interface DemoUser {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  phone: string
  avatar_url: string | null
}

export interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: ServiceCategory
  isActive: boolean
}

export interface Employee {
  id: string
  name: string
  email: string
  role: "employee"
  phone: string
  specialties: string[]
  rating: number
  isActive: boolean
  avatar?: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  createdAt?: string
  isActive?: boolean
  birthday?: string | null
  allergies?: string | null
  marketingConsent?: boolean
  preferredEmployeeId?: string | null
}

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  employeeId: string
  employeeName: string
  serviceId: string
  serviceName: string
  date: string
  time: string
  duration: number
  price: number
  status: AppointmentStatus
  notes?: string
  rating?: number
  createdAt: string
}

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  quantity: number
  minStock: number
  price: number
  salePrice?: number | null
  sku?: string | null
  supplier?: string
  lastRestocked?: string
  status?: InventoryStatus
}

export interface BusinessSettings {
  name: string
  slogan: string
  phone: string
  email: string
  address: string
  schedule: {
    monday: { open: string; close: string; isOpen: boolean }
    tuesday: { open: string; close: string; isOpen: boolean }
    wednesday: { open: string; close: string; isOpen: boolean }
    thursday: { open: string; close: string; isOpen: boolean }
    friday: { open: string; close: string; isOpen: boolean }
    saturday: { open: string; close: string; isOpen: boolean }
    sunday: { open: string; close: string; isOpen: boolean }
  }
  policies: {
    cancellationHours: number
    advanceBookingDays: number
    slotDuration: number
    breakBetweenAppointments: number
  }
  notifications: {
    emailEnabled: boolean
    whatsappEnabled: boolean
    reminderHoursBefore: number
    sendConfirmation: boolean
  }
  social: {
    instagram: string
    facebook: string
    twitter: string
  }
}
