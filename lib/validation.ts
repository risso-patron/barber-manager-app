/**
 * Input Validation & Sanitization
 * 
 * Funciones para validar y sanitizar inputs de usuario
 * Previene: XSS, SQL Injection, Code Injection
 */

import { z } from 'zod'

/**
 * Sanitiza HTML para prevenir XSS
 */
export function sanitizeHTML(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  
  return input.replace(/[&<>"'/]/g, (char) => map[char])
}

/**
 * Sanitiza input removiendo caracteres peligrosos
 */
export function sanitizeInput(input: string): string {
  // Remover null bytes
  let sanitized = input.replace(/\0/g, '')
  
  // Remover caracteres de control excepto newline y tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Trim espacios
  sanitized = sanitized.trim()
  
  return sanitized
}

/**
 * Valida email
 */
export const emailSchema = z.string()
  .email('Email inválido')
  .toLowerCase()
  .max(254, 'Email demasiado largo')

export function validateEmail(email: string): { valid: boolean; error?: string } {
  try {
    emailSchema.parse(email)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message }
    }
    return { valid: false, error: 'Email inválido' }
  }
}

/**
 * Valida contraseña segura
 */
export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(100, 'Contraseña demasiado larga')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')

export function validatePassword(password: string): { 
  valid: boolean
  strength: 'weak' | 'medium' | 'strong'
  errors: string[]
} {
  const result = passwordSchema.safeParse(password)
  
  if (!result.success) {
    return {
      valid: false,
      strength: 'weak',
      errors: result.error.errors.map(e => e.message)
    }
  }

  // Calcular fuerza
  let strength: 'weak' | 'medium' | 'strong' = 'medium'
  
  if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strength = 'strong'
  } else if (password.length < 10) {
    strength = 'weak'
  }

  return {
    valid: true,
    strength,
    errors: []
  }
}

/**
 * Valida teléfono
 */
export const phoneSchema = z.string()
  .regex(/^\+?[\d\s\-()]+$/, 'Formato de teléfono inválido')
  .min(10, 'Teléfono muy corto')
  .max(20, 'Teléfono muy largo')

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  try {
    phoneSchema.parse(phone)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message }
    }
    return { valid: false, error: 'Teléfono inválido' }
  }
}

/**
 * Valida nombre (sin números ni caracteres especiales)
 */
export const nameSchema = z.string()
  .min(2, 'Nombre muy corto')
  .max(100, 'Nombre muy largo')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, 'El nombre solo puede contener letras')

export function validateName(name: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeInput(name)
  
  try {
    nameSchema.parse(sanitized)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message }
    }
    return { valid: false, error: 'Nombre inválido' }
  }
}

/**
 * Valida fecha (debe ser futura para reservas)
 */
export function validateFutureDate(dateString: string, minDaysFromNow: number = 0): {
  valid: boolean
  error?: string
} {
  // Parsear como fecha local para evitar desfase de timezone (new Date('YYYY-MM-DD') es UTC)
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year!, month! - 1, day!)
  
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Fecha inválida' }
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  const minDate = new Date(now)
  minDate.setDate(minDate.getDate() + minDaysFromNow)

  if (date < minDate) {
    return { 
      valid: false, 
      error: minDaysFromNow > 0 
        ? `La fecha debe ser al menos ${minDaysFromNow} días en el futuro`
        : 'La fecha debe ser hoy o futura'
    }
  }

  return { valid: true }
}

/**
 * Valida hora en formato HH:MM
 */
export function validateTime(time: string): { valid: boolean; error?: string } {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  
  if (!timeRegex.test(time)) {
    return { valid: false, error: 'Formato de hora inválido (usa HH:MM)' }
  }

  return { valid: true }
}

/**
 * Previene SQL Injection básico (aunque usemos ORM, extra seguridad)
 */
export function isSQLInjectionAttempt(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
  ]

  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Valida que un string sea un UUID válido
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Schema para validación de cita
 */
export const appointmentSchema = z.object({
  clientName: nameSchema,
  clientEmail: emailSchema.optional(),
  clientPhone: phoneSchema,
  serviceId: z.string().min(1, 'Selecciona un servicio'),
  employeeId: z.string().min(1, 'Selecciona un barbero'),
  date: z.string().min(1, 'Selecciona una fecha'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida'),
  notes: z.string().max(500, 'Notas muy largas').optional(),
})

export type AppointmentInput = z.infer<typeof appointmentSchema>

/**
 * Valida input de cita completa
 */
export function validateAppointmentInput(data: unknown): {
  valid: boolean
  data?: AppointmentInput
  errors?: Record<string, string>
} {
  try {
    const validated = appointmentSchema.parse(data)
    
    // Validaciones adicionales
    const dateValidation = validateFutureDate(validated.date)
    if (!dateValidation.valid) {
      return {
        valid: false,
        errors: { date: dateValidation.error || 'Fecha inválida' }
      }
    }

    // Sanitizar notas si existen
    if (validated.notes) {
      validated.notes = sanitizeInput(validated.notes)
    }

    return {
      valid: true,
      data: validated
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message
        }
      })
      return { valid: false, errors }
    }
    return { valid: false, errors: { _global: 'Datos inválidos' } }
  }
}
