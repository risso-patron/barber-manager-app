/**
 * Demo business settings and configuration
 * Source: demo-config.ts (only source)
 */

import type { BusinessSettings } from "./types"

/**
 * Business configuration for the demo barbershop
 */
export const DEMO_BUSINESS_SETTINGS: BusinessSettings = {
  name: 'Barber Manager Demo',
  slogan: 'Tu estilo, nuestra pasión',
  phone: '+1 (555) 123-4567',
  email: 'info@barbermanager.demo',
  address: 'Av. Principal 123, Ciudad Demo',

  // Horarios
  schedule: {
    monday: { open: '09:00', close: '20:00', isOpen: true },
    tuesday: { open: '09:00', close: '20:00', isOpen: true },
    wednesday: { open: '09:00', close: '20:00', isOpen: true },
    thursday: { open: '09:00', close: '20:00', isOpen: true },
    friday: { open: '09:00', close: '21:00', isOpen: true },
    saturday: { open: '08:00', close: '18:00', isOpen: true },
    sunday: { open: '10:00', close: '14:00', isOpen: true }
  },

  // Políticas
  policies: {
    cancellationHours: 24,
    advanceBookingDays: 30,
    slotDuration: 15, // minutos
    breakBetweenAppointments: 5 // minutos
  },

  // Notificaciones
  notifications: {
    emailEnabled: true,
    whatsappEnabled: true,
    reminderHoursBefore: 24,
    sendConfirmation: true
  },

  // Redes sociales
  social: {
    instagram: '@barbermanagerdemo',
    facebook: 'BarberManagerDemo',
    twitter: '@barberdemo'
  }
}
