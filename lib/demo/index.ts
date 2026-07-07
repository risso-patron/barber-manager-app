/**
 * Demo Data Domain - Single Source of Truth
 *
 * This is the public API for all demo data.
 * All consumers should import from this module only.
 *
 * Architecture:
 * - Operational entities live in dedicated files (users, employees, services, etc.)
 * - Configuration and settings are separated from data
 * - No duplicated exports exist outside this domain
 *
 * Usage:
 *   import { DEMO_USERS, DEMO_SERVICES, isDemoMode } from "@/lib/demo"
 */

// Type definitions
export type {
  DemoUser,
  Service,
  Employee,
  Client,
  Appointment,
  InventoryItem,
  BusinessSettings,
  UserRole,
  AppointmentStatus,
  ServiceCategory,
  InventoryCategory,
  InventoryStatus
} from "./types"

// Demo mode detection and configuration
export { isDemoMode, STORAGE_KEYS, DEMO_MODE_MESSAGE } from "./settings"

// Status constants and UI helpers
export {
  APPOINTMENT_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  getNextStatusActions
} from "./constants"

// Operational demo data
export { DEMO_USERS } from "./users"
export { DEMO_SERVICES, getServiceById } from "./services"
export { DEMO_EMPLOYEES, getEmployeeById } from "./employees"
export { DEMO_CLIENTS, getClientById } from "./clients"
export { DEMO_INVENTORY } from "./inventory"
export {
  DEMO_APPOINTMENTS,
  getAppointmentsByDate,
  getAppointmentsByStatus,
  getAppointmentsByEmployee
} from "./appointments"
export { DEMO_BUSINESS_SETTINGS } from "./business"
