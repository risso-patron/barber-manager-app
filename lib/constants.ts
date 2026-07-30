/**
 * Application-wide constants
 */

export const APP_NAME = "Barber Manager"
export const APP_DESCRIPTION = "Sistema de gestión para barberías"

/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
  CLIENT: "client",
} as const

/**
 * Appointment statuses
 */
export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const

/**
 * Inventory movement types
 */
export const MOVEMENT_TYPES = {
  IN: "in",
  OUT: "out",
  ADJUSTMENT: "adjustment",
} as const

/**
 * Route paths
 */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  DASHBOARD: "/dashboard",
  ADMIN: "/admin",
  EMPLOYEE: "/employee",
  CLIENT: "/client",
} as const

/**
 * Dashboard routes by role
 */
export const DASHBOARD_BY_ROLE = {
  admin: ROUTES.ADMIN,
  employee: ROUTES.EMPLOYEE,
  client: ROUTES.CLIENT,
} as const

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REGISTER: "/api/auth/register",
    SESSION: "/api/auth/session",
  },
  USERS: "/api/users",
  APPOINTMENTS: "/api/appointments",
  SERVICES: "/api/services",
  INVENTORY: "/api/inventory",
} as const

/**
 * Time constants
 */
export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const

/**
 * Validation rules
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  EMAIL_REGEX: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
} as const

/**
 * Business settings defaults
 */
export const BUSINESS = {
  DEFAULT_APPOINTMENT_DURATION: 30, // minutes
  BUSINESS_HOURS_START: "09:00",
  BUSINESS_HOURS_END: "19:00",
  LOW_STOCK_THRESHOLD: 5,
} as const

/**
 * Local storage keys (DEPRECATED - Use Supabase Auth instead)
 * @deprecated These will be removed in future versions
 */
export const STORAGE_KEYS = {
  /** @deprecated Use Supabase session instead */
  CURRENT_USER: "currentUser",
  /** @deprecated Use Supabase session instead */
  WORK_STATUS: "workStatus",
  /** @deprecated Use Supabase session instead */
  DEMO_AUTH: "demo-auth-storage",
} as const

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: "Credenciales inválidas",
    UNAUTHORIZED: "No autorizado",
    SESSION_EXPIRED: "Sesión expirada. Por favor, inicia sesión nuevamente.",
    INSUFFICIENT_PERMISSIONS: "No tienes permisos para realizar esta acción",
  },
  VALIDATION: {
    REQUIRED_FIELD: "Este campo es requerido",
    INVALID_EMAIL: "Email inválido",
    PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres",
    PASSWORDS_DONT_MATCH: "Las contraseñas no coinciden",
  },
  GENERAL: {
    UNEXPECTED_ERROR: "Ha ocurrido un error inesperado",
    NETWORK_ERROR: "Error de conexión. Verifica tu internet.",
    NOT_FOUND: "Recurso no encontrado",
  },
} as const

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: "Inicio de sesión exitoso",
    LOGOUT_SUCCESS: "Sesión cerrada exitosamente",
    REGISTER_SUCCESS: "Registro exitoso. Ahora puedes iniciar sesión.",
  },
  APPOINTMENT: {
    CREATED: "Cita creada exitosamente",
    UPDATED: "Cita actualizada exitosamente",
    CANCELLED: "Cita cancelada exitosamente",
  },
  GENERAL: {
    SAVED: "Cambios guardados exitosamente",
    DELETED: "Eliminado exitosamente",
  },
} as const
