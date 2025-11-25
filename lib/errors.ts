/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = "AppError"
  }
}

/**
 * Authentication related errors
 */
export class AuthError extends AppError {
  constructor(message: string, details?: unknown) {
    super("AUTH_ERROR", message, 401, details)
    this.name = "AuthError"
  }
}

/**
 * Authorization/Permission errors
 */
export class PermissionError extends AppError {
  constructor(message: string = "No tienes permisos para realizar esta acción", details?: unknown) {
    super("PERMISSION_ERROR", message, 403, details)
    this.name = "PermissionError"
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string[]>, details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details)
    this.name = "ValidationError"
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string = "Recurso", details?: unknown) {
    super("NOT_FOUND", `${resource} no encontrado`, 404, details)
    this.name = "NotFoundError"
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = "Error de base de datos", details?: unknown) {
    super("DATABASE_ERROR", message, 500, details)
    this.name = "DatabaseError"
  }
}

/**
 * Error handler utility
 */
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError("UNKNOWN_ERROR", error.message, 500, error)
  }

  return new AppError("UNKNOWN_ERROR", "Ha ocurrido un error desconocido", 500, error)
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const appError = handleError(error)
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === "production" && appError.statusCode >= 500) {
    return "Ha ocurrido un error. Por favor, intenta nuevamente."
  }

  return appError.message
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  const appError = handleError(error)
  
  console.error("[Error]", {
    name: appError.name,
    code: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    details: appError.details,
    context,
    timestamp: new Date().toISOString(),
  })

  // In production, send to error tracking service (Sentry, etc.)
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to error tracking service
    // Sentry.captureException(appError, { contexts: { custom: context } })
  }
}
