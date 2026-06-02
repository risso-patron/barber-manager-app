import { NextRequest, NextResponse } from "next/server"
import { withRateLimit, strictLimiter } from "@/lib/rate-limit"
import { rescheduleAppointmentSchema } from "@/lib/schemas"
import { isDemoMode, DEMO_BUSINESS_SETTINGS } from "@/lib/demo-config"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server"

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const

type DayKey = (typeof DAY_NAMES)[number]

interface ScheduleDay {
  open: string
  close: string
  isOpen: boolean
}

/**
 * PATCH /api/appointments/[id]/reschedule
 *
 * Permite al cliente (o admin) reprogramar una cita existente.
 * Valida: horario de negocio, conflictos con otras citas del barbero,
 * estado de la cita (solo pending/confirmed son reprogramables) y
 * que la nueva fecha sea futura.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRateLimit(request, strictLimiter, async () => {
    try {
      const { id } = await params

      // ── Validación de body ──────────────────────────────────────────────────
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
      }

      const parsed = rescheduleAppointmentSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const { appointment_date, appointment_time, reason } = parsed.data

      // ── MODO DEMO ───────────────────────────────────────────────────────────
      if (isDemoMode()) {
        return NextResponse.json({
          success: true,
          appointment: {
            id,
            appointment_date,
            appointment_time,
            status: "confirmed",
            rescheduled_at: new Date().toISOString(),
          },
          message: "Cita reprogramada exitosamente (modo demo)",
        })
      }

      // ── Autenticación ───────────────────────────────────────────────────────
      const supabase = await createServerSupabaseClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }

      // ── Cargar cita existente (con admin client para leer sin restricción) ──
      const adminClient = createAdminSupabaseClient()

      const { data: appointment, error: fetchError } = await adminClient
        .from("appointments")
        .select(
          `id, client_id, barber_id, appointment_date, appointment_time, status,
           client:users!appointments_client_id_fkey(id, name, email, phone),
           barber:users!appointments_barber_id_fkey(id, name, email, phone),
           service:services(id, name, price, duration)`
        )
        .eq("id", id)
        .single()

      if (fetchError || !appointment) {
        return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
      }

      // ── Verificar permisos (solo el cliente dueño o admin) ──────────────────
      const { data: userProfile } = await adminClient
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      const isAdmin = userProfile?.role === "admin"
      const isOwner = appointment.client_id === user.id

      if (!isAdmin && !isOwner) {
        return NextResponse.json({ error: "Sin permiso para reprogramar esta cita" }, { status: 403 })
      }

      // ── Verificar estado reprogramable ──────────────────────────────────────
      if (!["pending", "confirmed"].includes(appointment.status)) {
        return NextResponse.json(
          { error: `No se puede reprogramar una cita en estado "${appointment.status}"` },
          { status: 409 }
        )
      }

      // ── Validar horario de negocio ──────────────────────────────────────────
      const { data: settingsRows } = await adminClient
        .from("business_settings")
        .select("setting_key, setting_value")
        .in("setting_key", DAY_NAMES.map((d) => `schedule_${d}`))

      let businessSchedule: Record<DayKey, ScheduleDay> = DEMO_BUSINESS_SETTINGS.schedule as Record<DayKey, ScheduleDay>

      if (settingsRows && settingsRows.length > 0) {
        const merged: Partial<Record<DayKey, ScheduleDay>> = {}
        for (const row of settingsRows) {
          const day = row.setting_key.replace("schedule_", "") as DayKey
          try {
            merged[day] = JSON.parse(row.setting_value)
          } catch {
            // si no es JSON válido, usar el default
          }
        }
        if (Object.keys(merged).length > 0) {
          businessSchedule = { ...businessSchedule, ...merged }
        }
      }

      const targetDate = new Date(`${appointment_date}T${appointment_time}:00`)
      const dayName = DAY_NAMES[targetDate.getDay()]
      const daySchedule = businessSchedule[dayName]

      if (!daySchedule?.isOpen) {
        return NextResponse.json(
          { error: `El negocio no atiende los ${dayName}` },
          { status: 422 }
        )
      }

      const [openH, openM] = daySchedule.open.split(":").map(Number)
      const [closeH, closeM] = daySchedule.close.split(":").map(Number)
      const [reqH, reqM] = appointment_time.split(":").map(Number)

      const openMinutes = openH * 60 + openM
      const closeMinutes = closeH * 60 + closeM
      const reqMinutes = reqH * 60 + reqM

      if (reqMinutes < openMinutes || reqMinutes >= closeMinutes) {
        return NextResponse.json(
          {
            error: `Horario fuera del rango de atención (${daySchedule.open} – ${daySchedule.close})`,
          },
          { status: 422 }
        )
      }

      // ── Verificar conflicto de horario con otras citas del barbero ──────────
      const { data: conflict } = await adminClient
        .from("appointments")
        .select("id")
        .eq("barber_id", appointment.barber_id)
        .eq("appointment_date", appointment_date)
        .eq("appointment_time", appointment_time)
        .neq("id", id)
        .in("status", ["pending", "confirmed"])
        .maybeSingle()

      if (conflict) {
        return NextResponse.json(
          { error: "El barbero ya tiene una cita en ese horario. Elige otro." },
          { status: 409 }
        )
      }

      // ── Actualizar cita ─────────────────────────────────────────────────────
      const { data: updated, error: updateError } = await adminClient
        .from("appointments")
        .update({
          appointment_date,
          appointment_time,
          status: "confirmed",
          notes: reason
            ? `Reprogramada: ${reason}`
            : (appointment as { notes?: string }).notes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (updateError || !updated) {
        console.error("Error actualizando cita:", updateError)
        return NextResponse.json({ error: "Error al reprogramar la cita" }, { status: 500 })
      }

      // ── Notificaciones ──────────────────────────────────────────────────────
      const { data: bizNameRow } = await adminClient
        .from("business_settings")
        .select("setting_value")
        .eq("setting_key", "barbershop_name")
        .maybeSingle()

      const { data: bizPhoneRow } = await adminClient
        .from("business_settings")
        .select("setting_value")
        .eq("setting_key", "barbershop_phone")
        .maybeSingle()

      const client = (appointment as { client: { name: string; email: string; phone: string } | null }).client
      const barber = (appointment as { barber: { name: string; email: string } | null }).barber
      const service = (appointment as { service: { name: string; price: number } | null }).service

      const notificationPayload = {
        type: "reschedule",
        clientName: client?.name ?? "Cliente",
        clientEmail: client?.email,
        clientPhone: client?.phone ?? "",
        employeeName: barber?.name ?? "Barbero",
        employeeEmail: barber?.email,
        serviceName: service?.name ?? "Servicio",
        date: appointment_date,
        time: appointment_time,
        price: service?.price ?? 0,
        barbershopName: bizNameRow?.setting_value ?? "Barber Manager",
        barbershopPhone: bizPhoneRow?.setting_value ?? "",
        reason: reason ?? null,
        previousDate: appointment.appointment_date,
        previousTime: appointment.appointment_time,
      }

      try {
        const origin = request.nextUrl.origin
        await fetch(`${origin}/api/notifications/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notificationPayload),
        })
      } catch (notifError) {
        // No es crítico — la cita ya se reprogramó
        console.warn("Advertencia: no se pudo enviar notificación de reprogramación", notifError)
      }

      return NextResponse.json({
        success: true,
        appointment: updated,
        message: "Cita reprogramada exitosamente",
      })
    } catch (error) {
      console.error("Error en PATCH /api/appointments/[id]/reschedule:", error)
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
  })
}
