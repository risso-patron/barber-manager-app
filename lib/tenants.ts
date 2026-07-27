import type { SupabaseClient } from "@supabase/supabase-js"

// Seam de tenants (R-1, ADR-028). La infraestructura habla SOLO de Tenant:
// hoy un tenant es una barbería; mañana puede ser cualquier tipo de negocio.
// La especialización ocurre en la capa de producto, nunca acá.
//
// Hoy: un único tenant construido desde business_settings.
// M1 (tabla tenants): solo cambia getTenants(); el resto del pipeline no se toca.

export interface TenantReminderConfig {
  enabled: boolean
  offsetsHours: number[]
  channels: Array<"email" | "sms">
}

export interface Tenant {
  id: string
  name: string
  /** Identificador IANA (ej. "America/Panama") — cualquier valor válido es aceptado. */
  timezone: string
  contactPhone: string | null
  reminders: TenantReminderConfig
}

/**
 * UUID estable del tenant único actual. Cuando exista la tabla tenants (M1),
 * su seed debe crear la fila con este mismo id para que la atribución
 * histórica de notification_queue.tenant_id siga siendo válida.
 */
export const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001"

/** Entorno de referencia del seed — NO es un valor forzado: cualquier IANA válido gana. */
export const DEFAULT_TIMEZONE = "America/Panama"

export const DEFAULT_REMINDER_CONFIG: TenantReminderConfig = {
  enabled: true,
  offsetsHours: [24],
  channels: ["email", "sms"],
}

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length === 0) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

const VALID_CHANNELS = ["email", "sms"] as const

/**
 * Normaliza la configuración de recordatorios leída de settings.
 * `legacyEnabled` es el flag histórico notifications.appointmentReminders.
 */
export function normalizeReminderConfig(
  raw: unknown,
  legacyEnabled: boolean | undefined
): TenantReminderConfig {
  const source = (raw ?? {}) as Record<string, unknown>

  const enabled =
    typeof source.enabled === "boolean"
      ? source.enabled
      : typeof legacyEnabled === "boolean"
        ? legacyEnabled
        : DEFAULT_REMINDER_CONFIG.enabled

  const rawOffsets = Array.isArray(source.offsetsHours) ? source.offsetsHours : []
  const offsetsHours = rawOffsets.filter(
    (o): o is number => typeof o === "number" && Number.isFinite(o) && o > 0
  )

  const rawChannels = Array.isArray(source.channels) ? source.channels : []
  const channels = rawChannels.filter((c): c is "email" | "sms" =>
    (VALID_CHANNELS as readonly string[]).includes(c as string)
  )

  return {
    enabled,
    offsetsHours: offsetsHours.length > 0 ? offsetsHours : [...DEFAULT_REMINDER_CONFIG.offsetsHours],
    channels: channels.length > 0 ? channels : [...DEFAULT_REMINDER_CONFIG.channels],
  }
}

/** business_settings.setting_value es TEXT con JSON serializado (script 01). */
function parseSettingValue(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === "object" ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

/**
 * Devuelve los tenants activos. Hoy: exactamente uno, armado desde
 * business_settings ('business' + 'notifications'). Con tabla tenants (M1),
 * esta función pasa a un SELECT y nada más cambia en el pipeline.
 */
export async function getTenants(db: SupabaseClient): Promise<Tenant[]> {
  const { data, error } = await db
    .from("business_settings")
    .select("setting_key, setting_value")
    .in("setting_key", ["business", "notifications"])

  if (error) {
    throw new Error(`No se pudo leer business_settings: ${error.message}`)
  }

  const byKey = new Map<string, Record<string, unknown>>()
  for (const row of data ?? []) {
    byKey.set(row.setting_key, parseSettingValue(row.setting_value))
  }

  const business = byKey.get("business") ?? {}
  const notifications = byKey.get("notifications") ?? {}

  return [
    {
      id: DEFAULT_TENANT_ID,
      name: typeof business.name === "string" && business.name ? business.name : "ORNO",
      timezone: isValidTimeZone(business.timezone) ? business.timezone : DEFAULT_TIMEZONE,
      contactPhone: typeof business.phone === "string" && business.phone ? business.phone : null,
      reminders: normalizeReminderConfig(
        notifications.reminders,
        typeof notifications.appointmentReminders === "boolean"
          ? notifications.appointmentReminders
          : undefined
      ),
    },
  ]
}
