import { describe, it, expect } from "vitest"
import {
  wallClockMs,
  getTenantNow,
  addDaysToDateString,
  computeDueReminders,
  buildReminderRow,
  generateReminders,
} from "@/lib/notifications/scheduler"
import { DEFAULT_TENANT_ID, type Tenant } from "@/lib/tenants"

const HOUR = 3_600_000

const tenant: Tenant = {
  id: DEFAULT_TENANT_ID,
  name: "Estudio Norte",
  timezone: "America/Panama",
  contactPhone: "+507 6000-0000",
  reminders: { enabled: true, offsetsHours: [24], channels: ["email", "sms"] },
}

describe("wallClockMs", () => {
  it("compara horas de pared en un marco fijo, independiente de la tz del sistema", () => {
    const a = wallClockMs("2026-07-10", "09:00:00")
    const b = wallClockMs("2026-07-10", "10:30")
    expect(b - a).toBe(1.5 * HOUR)
  })

  it("cruza días correctamente", () => {
    const hoy = wallClockMs("2026-07-10", "23:00")
    const maniana = wallClockMs("2026-07-11", "01:00")
    expect(maniana - hoy).toBe(2 * HOUR)
  })
})

describe("getTenantNow", () => {
  it("convierte un instante UTC a hora de pared de America/Panama (UTC-5, sin DST)", () => {
    const now = new Date("2026-07-10T14:00:00Z")
    const local = getTenantNow("America/Panama", now)
    expect(local.date).toBe("2026-07-10")
    expect(local.time).toBe("09:00")
  })

  it("maneja el cruce de día hacia atrás", () => {
    const now = new Date("2026-07-10T03:00:00Z")
    const local = getTenantNow("America/Panama", now)
    expect(local.date).toBe("2026-07-09")
    expect(local.time).toBe("22:00")
  })

  it("funciona con cualquier IANA, no solo el de referencia", () => {
    const now = new Date("2026-07-10T14:00:00Z")
    expect(getTenantNow("Asia/Tokyo", now).date).toBe("2026-07-10")
    expect(getTenantNow("Asia/Tokyo", now).time).toBe("23:00")
    expect(getTenantNow("Europe/Madrid", now).time).toBe("16:00") // verano CEST
  })

  it("ms es coherente con wallClockMs para poder comparar contra citas", () => {
    const now = new Date("2026-07-10T14:00:00Z")
    const local = getTenantNow("America/Panama", now)
    expect(local.ms).toBe(wallClockMs("2026-07-10", "09:00"))
  })
})

describe("addDaysToDateString", () => {
  it("suma días cruzando mes", () => {
    expect(addDaysToDateString("2026-07-31", 1)).toBe("2026-08-01")
    expect(addDaysToDateString("2026-07-10", 2)).toBe("2026-07-12")
  })
})

describe("computeDueReminders — ventana due, no instante exacto", () => {
  const appt = { id: "a1", date: "2026-07-11", time: "10:00:00" }

  it("no vence antes de entrar en la ventana del offset", () => {
    // 24h antes de la cita = 2026-07-10 10:00; ahora son las 09:00 → todavía no
    const now = wallClockMs("2026-07-10", "09:00")
    expect(computeDueReminders([appt], [24], now)).toEqual([])
  })

  it("vence dentro de la ventana (un tick tardío igual lo captura)", () => {
    const now = wallClockMs("2026-07-10", "10:30")
    expect(computeDueReminders([appt], [24], now)).toEqual([
      { appointmentId: "a1", offsetHours: 24 },
    ])
  })

  it("el borde exacto cuenta como vencido", () => {
    const now = wallClockMs("2026-07-10", "10:00")
    expect(computeDueReminders([appt], [24], now)).toHaveLength(1)
  })

  it("una cita ya pasada nunca genera recordatorio", () => {
    const now = wallClockMs("2026-07-11", "10:00")
    expect(computeDueReminders([appt], [24], now)).toEqual([])
  })

  it("cada offset genera un recordatorio independiente", () => {
    // ahora = 09:00 del día de la cita: el de 24h ya venció, el de 2h aún no (10:00 - 2h = 08:00 → sí venció)
    const now = wallClockMs("2026-07-11", "09:00")
    const due = computeDueReminders([appt], [24, 2], now)
    expect(due).toEqual([
      { appointmentId: "a1", offsetHours: 24 },
      { appointmentId: "a1", offsetHours: 2 },
    ])
  })

  it("offset chico todavía fuera de ventana no se genera", () => {
    const now = wallClockMs("2026-07-11", "07:00")
    const due = computeDueReminders([appt], [24, 2], now)
    expect(due).toEqual([{ appointmentId: "a1", offsetHours: 24 }])
  })
})

describe("buildReminderRow", () => {
  const appt = {
    id: "a1",
    date: "2026-07-11",
    time: "10:00:00",
    clientName: "Luis",
    clientEmail: "luis@example.com",
    clientPhone: "+507 6111-1111",
    staffName: "Marcos",
    serviceName: "Corte clásico",
  }

  it("arma la fila con atribución de tenant y clave de dedup", () => {
    const row = buildReminderRow(tenant, appt, 24)
    expect(row).not.toBeNull()
    expect(row?.type).toBe("reminder")
    expect(row?.tenant_id).toBe(tenant.id)
    expect(row?.appointment_id).toBe("a1")
    expect(row?.reminder_offset_hours).toBe(24)
    expect(row?.recipient_email).toBe("luis@example.com")
    expect(row?.recipient_phone).toBe("+507 6111-1111")
    expect(row?.message_sms).toContain("Estudio Norte")
    expect(row?.message_email).toContain("10:00")
    expect(row?.subject_email).toContain("Recordatorio")
  })

  it("respeta los canales configurados del tenant", () => {
    const soloEmail: Tenant = {
      ...tenant,
      reminders: { ...tenant.reminders, channels: ["email"] },
    }
    const row = buildReminderRow(soloEmail, appt, 24)
    expect(row?.recipient_phone).toBeNull()
    expect(row?.recipient_email).toBe("luis@example.com")
  })

  it("devuelve null si no queda ningún canal utilizable (constraint has_recipient)", () => {
    const soloEmail: Tenant = {
      ...tenant,
      reminders: { ...tenant.reminders, channels: ["email"] },
    }
    const sinEmail = { ...appt, clientEmail: null }
    expect(buildReminderRow(soloEmail, sinEmail, 24)).toBeNull()
  })
})

describe("generateReminders — dedup a nivel de base de datos (evidencia sustituta de concurrencia real)", () => {
  // El Acceptance Contract exige demostrar que EL PIPELINE es seguro frente a
  // concurrencia, no que el scheduler de Vercel ejecute dos workers a la vez
  // (no determinístico). Esta prueba fija, en código, que generateReminders
  // SIEMPRE pide a Postgres el mismo mecanismo a prueba de carreras:
  // ON CONFLICT DO NOTHING vía upsert(..., { onConflict, ignoreDuplicates }).
  // N ejecuciones concurrentes del cron emiten esta misma llamada N veces;
  // la garantía de fila única la resuelve el índice UNIQUE (script 36), no
  // el orden de llegada.

  function fakeDbWithOneAppointment() {
    const upsertCalls: Array<{ rows: unknown[]; opts: unknown }> = []
    const appointmentsChain = {
      select: () => appointmentsChain,
      in: () => appointmentsChain,
      gte: () => appointmentsChain,
      lte: async () => ({
        data: [
          {
            id: "a1",
            appointment_date: "2026-07-11",
            appointment_time: "10:00:00",
            client: { name: "Luis", email: "luis@example.com", phone: "+507 6111-1111" },
            barber: { name: "Marcos" },
            service: { name: "Corte clásico" },
          },
        ],
        error: null,
      }),
    }
    const db = {
      from: (table: string) => {
        if (table === "appointments") return appointmentsChain
        if (table === "notification_queue") {
          return {
            upsert: (rows: unknown[], opts: unknown) => {
              upsertCalls.push({ rows, opts })
              return Promise.resolve({ error: null })
            },
          }
        }
        throw new Error(`tabla inesperada: ${table}`)
      },
    }
    return { db, upsertCalls }
  }

  it("pide dedup por (appointment_id, reminder_offset_hours) con ignoreDuplicates", async () => {
    const { db, upsertCalls } = fakeDbWithOneAppointment()
    // now = 10:00 Panamá del día previo → offset 24h vencido para la cita de mañana 10:00
    const now = new Date("2026-07-10T15:00:00Z")

    const result = await generateReminders(db as never, tenant, now)

    expect(result.enqueued).toBe(1)
    expect(upsertCalls).toHaveLength(1)
    expect(upsertCalls[0]!.opts).toEqual({
      onConflict: "appointment_id,reminder_offset_hours",
      ignoreDuplicates: true,
    })
    expect(upsertCalls[0]!.rows).toEqual([
      expect.objectContaining({ appointment_id: "a1", reminder_offset_hours: 24 }),
    ])
  })

  it("N invocaciones \"concurrentes\" emiten N llamadas idénticas — el árbitro es el índice UNIQUE, no el código", async () => {
    const { db, upsertCalls } = fakeDbWithOneAppointment()
    const now = new Date("2026-07-10T15:00:00Z")

    await Promise.all([
      generateReminders(db as never, tenant, now),
      generateReminders(db as never, tenant, now),
      generateReminders(db as never, tenant, now),
    ])

    expect(upsertCalls).toHaveLength(3)
    for (const call of upsertCalls) {
      expect(call.opts).toEqual({
        onConflict: "appointment_id,reminder_offset_hours",
        ignoreDuplicates: true,
      })
    }
    // La app nunca decide "ya existe, no inserto" — la garantía de fila
    // única la resuelve el índice UNIQUE de script 36, no el orden de llegada.
  })
})
