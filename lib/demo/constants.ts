/**
 * Constants for appointment statuses and UI labels
 */

import type { AppointmentStatus } from "./types"

export const APPOINTMENT_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
} as const

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió'
}

export const STATUS_COLORS = {
  pending: 'yellow',
  confirmed: 'blue',
  completed: 'green',
  cancelled: 'red',
  no_show: 'gray'
} as const

/**
 * Get valid status transition actions for a given status
 */
export function getNextStatusActions(status: AppointmentStatus): { status: AppointmentStatus; label: string }[] {
  switch (status) {
    case "pending":
      return [
        { status: "confirmed", label: "Confirmar" },
        { status: "no_show", label: "No se presentó" },
        { status: "cancelled", label: "Cancelar" },
      ]
    case "confirmed":
      return [
        { status: "completed", label: "Completar" },
        { status: "no_show", label: "No se presentó" },
        { status: "cancelled", label: "Cancelar" },
      ]
    default:
      return []
  }
}
