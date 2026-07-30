import type { SupabaseClient } from "@supabase/supabase-js"
import type { Tenant } from "@/lib/tenants"

// ReminderScheduler (R-1, ADR-028): descubre qué recordatorios deben generarse
// y los encola con clave de dedup garantizada por la base de datos.
// NO envía nada — el envío es responsabilidad de NotificationProcessor.
//
// Las citas guardan fecha/hora de pared del tenant (DATE + TIME sin zona,
// script 01), así que nunca se convierten a UTC: se convierte "ahora" a la
// hora local del tenant y se compara en ese marco.

export interface SchedulableAppointment {
  id: string
  /** YYYY-MM-DD, hora de pared del tenant */
  date: string
  /** HH:mm o HH:mm:ss */
  time: string
}

export interface DueReminder {
  appointmentId: string
  offsetHours: number
}

export interface ReminderAppointment extends SchedulableAppointment {
  clientName: string
  clientEmail: string | null
  clientPhone: string | null
  staffName: string
  serviceName: string
}

export interface ReminderQueueRow {
  type: "reminder"
  tenant_id: string
  appointment_id: string
  reminder_offset_hours: number
  recipient_phone: string | null
  recipient_email: string | null
  recipient_name: string
  message_sms: string | null
  message_email: string | null
  subject_email: string | null
  metadata: Record<string, unknown>
}

function normalizeTime(time: string): string {
  return /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time
}

/**
 * Milisegundos de una hora de pared interpretada en un marco fijo (UTC).
 * Solo sirve para COMPARAR dos horas de pared del mismo tenant — nunca
 * representa un instante real.
 */
export function wallClockMs(date: string, time: string): number {
  return Date.parse(`${date}T${normalizeTime(time)}Z`)
}

/** "Ahora" expresado como hora de pared del tenant (cualquier IANA válido). */
export function getTenantNow(
  timezone: string,
  now: Date = new Date()
): { date: string; time: string; ms: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00"
  const date = `${get("year")}-${get("month")}-${get("day")}`
  const time = `${get("hour")}:${get("minute")}`
  return { date, time, ms: wallClockMs(date, time) }
}

export function addDaysToDateString(date: string, days: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`) + days * 86_400_000
  return new Date(ms).toISOString().slice(0, 10)
}

/**
 * Ventana "due" (no instante exacto): un recordatorio vence cuando
 * cita − offset ≤ ahora < cita. Un tick caído no pierde recordatorios —
 * el siguiente los captura; el índice UNIQUE evita duplicados.
 */
export function computeDueReminders(
  appointments: SchedulableAppointment[],
  offsetsHours: number[],
  tenantNowMs: number
): DueReminder[] {
  const due: DueReminder[] = []
  for (const appt of appointments) {
    const apptMs = wallClockMs(appt.date, appt.time)
    if (Number.isNaN(apptMs) || tenantNowMs >= apptMs) continue
    for (const offsetHours of offsetsHours) {
      if (apptMs - offsetHours * 3_600_000 <= tenantNowMs) {
        due.push({ appointmentId: appt.id, offsetHours })
      }
    }
  }
  return due
}

/**
 * Arma la fila de la cola respetando los canales del tenant.
 * Devuelve null si no queda ningún canal utilizable (la tabla exige
 * al menos un destinatario — constraint has_recipient, script 31).
 */
export function buildReminderRow(
  tenant: Tenant,
  appt: ReminderAppointment,
  offsetHours: number
): ReminderQueueRow | null {
  const wantsEmail = tenant.reminders.channels.includes("email")
  const wantsSms = tenant.reminders.channels.includes("sms")
  const email = wantsEmail && appt.clientEmail ? appt.clientEmail : null
  const phone = wantsSms && appt.clientPhone ? appt.clientPhone : null
  if (!email && !phone) return null

  const timeLabel = appt.time.slice(0, 5)
  const messageSms =
    `Hola ${appt.clientName}! Te recordamos tu cita en ${tenant.name}: ` +
    `${appt.date} a las ${timeLabel} con ${appt.staffName}. Servicio: ${appt.serviceName}.`
  const messageEmail =
    `Hola ${appt.clientName},\n\n` +
    `Te recordamos tu próxima cita.\n\n` +
    `Fecha: ${appt.date}\nHora: ${timeLabel}\n` +
    `Atiende: ${appt.staffName}\nServicio: ${appt.serviceName}\n\n` +
    (tenant.contactPhone ? `Ante cualquier duda: ${tenant.contactPhone}\n\n` : "") +
    `¡Te esperamos!`

  return {
    type: "reminder",
    tenant_id: tenant.id,
    appointment_id: appt.id,
    reminder_offset_hours: offsetHours,
    recipient_phone: phone,
    recipient_email: email,
    recipient_name: appt.clientName,
    message_sms: phone ? messageSms : null,
    message_email: email ? messageEmail : null,
    subject_email: email ? `⏰ Recordatorio de tu cita — ${tenant.name}` : null,
    metadata: {
      tenant_id: tenant.id,
      appointment_id: appt.id,
      offset_hours: offsetHours,
      generated_by: "reminder-scheduler",
    },
  }
}

interface AppointmentJoinRow {
  id: string
  appointment_date: string
  appointment_time: string
  client: { name: string | null; email: string | null; phone: string | null } | null
  barber: { name: string | null } | null
  service: { name: string | null } | null
}

/**
 * Descubre y encola los recordatorios vencidos de un tenant.
 * El dedup es responsabilidad del índice UNIQUE
 * (appointment_id, reminder_offset_hours) — script 36 — vía upsert con
 * ignoreDuplicates: N ejecuciones concurrentes insertan cada fila una sola vez.
 */
export async function generateReminders(
  db: SupabaseClient,
  tenant: Tenant,
  now: Date = new Date()
): Promise<{ scanned: number; due: number; enqueued: number }> {
  const { enabled, offsetsHours } = tenant.reminders
  if (!enabled || offsetsHours.length === 0) {
    return { scanned: 0, due: 0, enqueued: 0 }
  }

  const tenantNow = getTenantNow(tenant.timezone, now)
  const horizonDays = Math.ceil(Math.max(...offsetsHours) / 24)

  const { data, error } = await db
    .from("appointments")
    .select(
      `id, appointment_date, appointment_time,
       client:users!appointments_client_id_fkey(name, email, phone),
       barber:users!appointments_barber_id_fkey(name),
       service:services(name)`
    )
    .in("status", ["pending", "confirmed"])
    .gte("appointment_date", tenantNow.date)
    .lte("appointment_date", addDaysToDateString(tenantNow.date, horizonDays))

  if (error) {
    throw new Error(`ReminderScheduler: error consultando citas: ${error.message}`)
  }

  const appointments = (data ?? []) as unknown as AppointmentJoinRow[]
  const byId = new Map(appointments.map((a) => [a.id, a]))
  const due = computeDueReminders(
    appointments.map((a) => ({ id: a.id, date: a.appointment_date, time: a.appointment_time })),
    offsetsHours,
    tenantNow.ms
  )

  const rows: ReminderQueueRow[] = []
  for (const { appointmentId, offsetHours } of due) {
    const appt = byId.get(appointmentId)
    if (!appt) continue
    const row = buildReminderRow(
      tenant,
      {
        id: appt.id,
        date: appt.appointment_date,
        time: appt.appointment_time,
        clientName: appt.client?.name ?? "Cliente",
        clientEmail: appt.client?.email ?? null,
        clientPhone: appt.client?.phone ?? null,
        staffName: appt.barber?.name ?? "nuestro equipo",
        serviceName: appt.service?.name ?? "tu servicio",
      },
      offsetHours
    )
    if (row) rows.push(row)
  }

  if (rows.length === 0) {
    return { scanned: appointments.length, due: due.length, enqueued: 0 }
  }

  const { error: upsertError } = await db
    .from("notification_queue")
    .upsert(rows, { onConflict: "appointment_id,reminder_offset_hours", ignoreDuplicates: true })

  if (upsertError) {
    throw new Error(`ReminderScheduler: error encolando: ${upsertError.message}`)
  }

  return { scanned: appointments.length, due: due.length, enqueued: rows.length }
}
