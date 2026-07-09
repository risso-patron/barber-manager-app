// ORNO Scheduling Kit · M4 · Core types
// The domain model every surface shares (admin board, employee day, client
// picker, marketplace, WhatsApp bot, AI assistant). Pure data — no React.
//
// Timezone-ready: all instants are ISO 8601 with offset; per-schedule IANA
// timezone drives display math. Multi-location: locationId everywhere.

export type AppointmentState =
  | "pending" // sin confirmar
  | "confirmed"
  | "checked_in" // en el local
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"

export type SyncState = "synced" | "syncing" | "conflict" | "offline"

export interface SchedAppointment {
  id: string
  locationId: string
  /** Resource = barber chair today; room/station tomorrow. */
  resourceId: string
  clientId?: string
  clientName: string
  serviceName: string
  /** Minor units (centavos) — formatting at the edge. */
  priceMinor?: number
  currency?: string
  /** ISO 8601 with offset. */
  startsAt: string
  endsAt: string
  state: AppointmentState
  paid?: boolean
  note?: string
  isWalkIn?: boolean
  isFirstVisit?: boolean
  /** Optimistic-UI flag — engine renders instantly, reconciles later. */
  sync?: SyncState
}

export interface ScheduleBlock {
  id: string
  resourceId: string
  locationId: string
  startsAt: string
  endsAt: string
  /** "Almuerzo", "Fuera de turno"… */
  label: string
}

export interface SchedResource {
  id: string
  locationId: string
  name: string
  initials?: string
  /** Working intervals for the visible day (already tz-localized by the caller). */
  workingHours?: Array<{ startsAt: string; endsAt: string }>
  subtitle?: string
}

export interface WalkInEntry {
  id: string
  name: string
  serviceName?: string
  preferredResourceId?: string
  arrivedAt: string
  estimatedMinutes?: number
}

export interface ScheduleGap {
  resourceId: string
  startsAt: string
  endsAt: string
  minutes: number
  /** Best service that fits — computed by suggestGaps. */
  fitsService?: { name: string; minutes: number }
}

export interface ScheduleConflict {
  /** The move/resize that caused it. */
  attempted: { appointmentId: string; resourceId: string; startsAt: string; endsAt: string }
  /** Who it collides with. */
  collidesWith: SchedAppointment[]
  /** Nearest free alternatives, best first. */
  alternatives: Array<{ resourceId: string; startsAt: string; endsAt: string }>
}

export interface ScheduleConfig {
  /** IANA tz of the location, e.g. "America/Argentina/Buenos_Aires". */
  timezone: string
  /** Visible day window, minutes from midnight local. */
  dayStartMin: number
  dayEndMin: number
  /** Drag/resize snap. Default 15. */
  snapMinutes: number
  /** px per minute — density. Default 1.2. */
  pxPerMinute: number
}

export const DEFAULT_CONFIG: ScheduleConfig = {
  timezone: "America/Argentina/Buenos_Aires",
  dayStartMin: 9 * 60,
  dayEndMin: 20 * 60,
  snapMinutes: 15,
  pxPerMinute: 1.2,
}
