import { describe, it, expect } from "vitest"
import {
  DEFAULT_TENANT_ID,
  DEFAULT_REMINDER_CONFIG,
  DEFAULT_TIMEZONE,
  isValidTimeZone,
  normalizeReminderConfig,
} from "@/lib/tenants"

describe("isValidTimeZone", () => {
  it("acepta cualquier identificador IANA válido", () => {
    expect(isValidTimeZone("America/Panama")).toBe(true)
    expect(isValidTimeZone("Europe/Madrid")).toBe(true)
    expect(isValidTimeZone("Asia/Tokyo")).toBe(true)
    expect(isValidTimeZone("UTC")).toBe(true)
  })

  it("rechaza identificadores inválidos o vacíos", () => {
    expect(isValidTimeZone("America/Springfield")).toBe(false)
    expect(isValidTimeZone("no-es-una-tz")).toBe(false)
    expect(isValidTimeZone("")).toBe(false)
    expect(isValidTimeZone(undefined)).toBe(false)
  })
})

describe("normalizeReminderConfig", () => {
  it("devuelve defaults cuando no hay configuración", () => {
    expect(normalizeReminderConfig(undefined, undefined)).toEqual(DEFAULT_REMINDER_CONFIG)
  })

  it("respeta el flag legado appointmentReminders=false", () => {
    const config = normalizeReminderConfig(undefined, false)
    expect(config.enabled).toBe(false)
  })

  it("sanea offsets: descarta valores no positivos o no numéricos", () => {
    const config = normalizeReminderConfig(
      { enabled: true, offsetsHours: [24, -1, 0, "x", 2], channels: ["email", "sms"] },
      undefined
    )
    expect(config.offsetsHours).toEqual([24, 2])
  })

  it("cae a defaults si offsets queda vacío tras sanear", () => {
    const config = normalizeReminderConfig(
      { enabled: true, offsetsHours: [-5], channels: ["email"] },
      undefined
    )
    expect(config.offsetsHours).toEqual(DEFAULT_REMINDER_CONFIG.offsetsHours)
  })

  it("sanea canales desconocidos", () => {
    const config = normalizeReminderConfig(
      { enabled: true, offsetsHours: [24], channels: ["email", "paloma"] },
      undefined
    )
    expect(config.channels).toEqual(["email"])
  })
})

describe("constantes del seam de tenants", () => {
  it("DEFAULT_TENANT_ID es un uuid estable (la futura tabla tenants lo seedea)", () => {
    expect(DEFAULT_TENANT_ID).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )
  })

  it("DEFAULT_TIMEZONE es un IANA válido (entorno de referencia)", () => {
    expect(isValidTimeZone(DEFAULT_TIMEZONE)).toBe(true)
  })
})
