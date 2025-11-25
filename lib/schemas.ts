import { z } from "zod"
import { VALIDATION } from "./constants"

/**
 * Authentication schemas
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Email inválido")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`)
    .max(VALIDATION.PASSWORD_MAX_LENGTH, `La contraseña no puede exceder ${VALIDATION.PASSWORD_MAX_LENGTH} caracteres`),
})

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(VALIDATION.NAME_MIN_LENGTH, `El nombre debe tener al menos ${VALIDATION.NAME_MIN_LENGTH} caracteres`)
      .max(VALIDATION.NAME_MAX_LENGTH, `El nombre no puede exceder ${VALIDATION.NAME_MAX_LENGTH} caracteres`)
      .trim(),
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Email inválido")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(VALIDATION.PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`)
      .max(VALIDATION.PASSWORD_MAX_LENGTH)
      .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
      .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
      .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
    confirmPassword: z.string(),
    role: z.enum(["client", "employee", "admin"]).default("client"),
    phone: z
      .string()
      .regex(VALIDATION.PHONE_REGEX, "Número de teléfono inválido")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.NAME_MIN_LENGTH)
    .max(VALIDATION.NAME_MAX_LENGTH)
    .trim()
    .optional(),
  phone: z
    .string()
    .regex(VALIDATION.PHONE_REGEX, "Número de teléfono inválido")
    .optional()
    .or(z.literal("")),
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")),
})

/**
 * Appointment schemas
 */
export const createAppointmentSchema = z.object({
  client_id: z.string().uuid("ID de cliente inválido"),
  barber_id: z.string().uuid("ID de barbero inválido"),
  service_id: z.string().uuid("ID de servicio inválido"),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (formato: YYYY-MM-DD)"),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (formato: HH:MM)"),
  notes: z.string().max(500, "Las notas no pueden exceder 500 caracteres").optional(),
})

export const updateAppointmentSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  notes: z.string().max(500).optional(),
  feedback: z.string().max(1000).optional(),
  rating: z.number().min(1).max(5).optional(),
})

/**
 * Service schemas
 */
export const createServiceSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).optional(),
  price: z.number().positive("El precio debe ser mayor a 0"),
  duration: z.number().int().positive("La duración debe ser mayor a 0"),
  is_active: z.boolean().default(true),
})

export const updateServiceSchema = createServiceSchema.partial()

/**
 * Inventory schemas
 */
export const createInventoryItemSchema = z.object({
  product_name: z.string().min(2).max(100).trim(),
  quantity: z.number().int().min(0, "La cantidad no puede ser negativa"),
  min_stock: z.number().int().min(0, "El stock mínimo no puede ser negativo").default(5),
  supplier: z.string().max(100).optional(),
  cost_per_unit: z.number().positive("El costo debe ser mayor a 0").optional(),
})

export const updateInventoryItemSchema = createInventoryItemSchema.partial()

export const createInventoryMovementSchema = z.object({
  inventory_id: z.string().uuid(),
  movement_type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().int(),
  reason: z.string().max(500).optional(),
  created_by: z.string().uuid(),
})

/**
 * Type inference helpers
 */
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>
export type CreateInventoryMovementInput = z.infer<typeof createInventoryMovementSchema>
