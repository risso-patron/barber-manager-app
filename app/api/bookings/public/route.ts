import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { signActivationToken } from "@/lib/booking-activation-token"

/**
 * API Route para crear reservas desde el enlace público
 * POST /api/bookings/public
 */

interface PublicBookingRequest {
  barbershop: string
  clientId?: string
  clientName: string
  clientEmail?: string
  clientPhone: string
  serviceId: string
  serviceName: string
  employeeId: string
  employeeName: string
  date: string
  time: string
  duration: number
  price: number
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const data: PublicBookingRequest = await request.json()

    // Validar datos requeridos
    if (!data.clientName || !data.clientPhone || !data.serviceId || !data.employeeId || !data.date || !data.time) {
      return NextResponse.json(
        { success: false, error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    // Validar formato de teléfono
    if (!/^\+?[\d\s\-()]+$/.test(data.clientPhone)) {
      return NextResponse.json(
        { success: false, error: "Formato de teléfono inválido" },
        { status: 400 }
      )
    }

    // Validar formato de email si se proporciona
    if (data.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.clientEmail)) {
      return NextResponse.json(
        { success: false, error: "Formato de email inválido" },
        { status: 400 }
      )
    }

    // Demo mode: sin Supabase, devolver reserva simulada exitosa
    const hasSupabaseConfig = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    if (!hasSupabaseConfig) {
      return NextResponse.json({
        success: true,
        appointmentId: `demo-${Date.now()}`,
        message: "Reserva registrada en modo demo",
      })
    }

    const supabase = (() => {
      try {
        return createAdminSupabaseClient()
      } catch (err) {
        console.error('[bookings/public] Admin client init failed:', err)
        return null
      }
    })()

    if (!supabase) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Buscar o crear cliente por teléfono/email
    let clientId: string

    // Si viene un clientId (usuario logueado), usarlo directamente
    if (data.clientId) {
      clientId = data.clientId
    } else {
    // Buscar usuario existente por email o teléfono
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(
        data.clientEmail
          ? `phone.eq.${data.clientPhone},email.eq.${data.clientEmail}`
          : `phone.eq.${data.clientPhone}`
      )
      .eq("role", "client")
      .maybeSingle()

    if (existingUser) {
      clientId = existingUser.id
    } else {
      // Crear auth user + perfil para el cliente
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.clientEmail || `${data.clientPhone.replace(/\D/g, "")}@guest.barber`,
        phone: data.clientPhone,
        email_confirm: true,
        user_metadata: { name: data.clientName },
      })

      if (authError || !authData.user) {
        return NextResponse.json({ success: false, error: "Error creando cliente" }, { status: 500 })
      }

      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        name: data.clientName,
        email: data.clientEmail || `${data.clientPhone.replace(/\D/g, "")}@guest.barber`,
        phone: data.clientPhone,
        role: "client",
      })

      if (profileError) {
        return NextResponse.json({ success: false, error: "Error creando perfil" }, { status: 500 })
      }

      clientId = authData.user.id
    }
    }

    // Validar que la fecha/hora es futura
    const appointmentDateTime = new Date(`${data.date}T${data.time}`)
    const now = new Date()
    if (appointmentDateTime <= now) {
      return NextResponse.json(
        { success: false, error: "La fecha y hora deben ser futuras" },
        { status: 400 }
      )
    }

  // Validar solapamiento real considerando duración del servicio
const { data: hasOverlap, error: overlapError } = await supabase
  .rpc("check_appointment_overlap", {
    p_barber_id:  data.employeeId,
    p_date:       data.date,
    p_start_time: data.time,
    p_duration:   data.duration,
  })

if (overlapError) {
  console.error("[bookings/public] Error validando solapamiento:", overlapError)
  return NextResponse.json(
    { success: false, error: "Error validando disponibilidad" },
    { status: 500 }
  )
}

if (hasOverlap) {
  return NextResponse.json(
    { success: false, error: "Este horario ya está ocupado. Por favor elige otro." },
    { status: 409 }
  )
}

    // Obtener teléfono de barbershop desde business_settings
    const { data: settings } = await supabase
      .from("business_settings")
      .select("setting_value")
      .eq("setting_key", "barbershop_phone")
      .maybeSingle()

    const barbershopPhone = settings?.setting_value || "+1 (555) 123-4567"
    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .insert({
        client_id: clientId,
        barber_id: data.employeeId,
        service_id: data.serviceId,
        appointment_date: data.date,
        appointment_time: data.time,
        status: "pending",
        notes: data.notes || null,
      })
      .select()
      .single()

    if (apptError || !appointment) {
      return NextResponse.json({ success: false, error: "Error guardando reserva" }, { status: 500 })
    }

    const booking = {
      id: appointment.id,
      ...data,
      status: "pending",
      createdAt: appointment.created_at,
    }

    // Token de activación de cuenta (RH-002 · A1) — válido solo para este
    // cliente/teléfono, 15 minutos, sin almacenamiento adicional.
    const activationToken = signActivationToken(clientId, data.clientPhone)

    // Encolar notificación (procesada de forma asíncrona por el cron de Vercel — ADR-028)
    try {
      const shopName = data.barbershop
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase())
      const messageSms =
        `Hola ${data.clientName}! Tu cita en ${shopName} está confirmada: ` +
        `${data.date} a las ${data.time} con ${data.employeeName}. ` +
        `Servicio: ${data.serviceName}. Total: $${data.price}.`
      const messageEmail =
        `Hola ${data.clientName},\n\n` +
        `Tu reserva ha sido confirmada.\n\n` +
        `Fecha: ${data.date}\nHora: ${data.time}\n` +
        `Barbero: ${data.employeeName}\nServicio: ${data.serviceName}\n` +
        `Total: $${data.price}\n\n` +
        `Ante cualquier duda: ${barbershopPhone}\n\n¡Te esperamos!`

      await supabase.from("notification_queue").insert({
        type: "appointment_created",
        recipient_phone: data.clientPhone,
        recipient_email: data.clientEmail || null,
        recipient_name: data.clientName,
        message_sms: messageSms,
        message_email: messageEmail,
        subject_email: `✅ Reserva confirmada — ${shopName}`,
        metadata: {
          appointment_id: appointment.id,
          service_name: data.serviceName,
          employee_name: data.employeeName,
          date: data.date,
          time: data.time,
          price: data.price,
        },
      })
    } catch (error) {
      console.error("[bookings/public] Error encolando notificación:", error)
      // No fallar la reserva si la notificación falla
    }

    return NextResponse.json({
      success: true,
      booking,
      activationToken,
      message: "Reserva creada exitosamente"
    })

  } catch (error) {
    console.error("Error creando reserva pública:", error)
    return NextResponse.json(
      { success: false, error: "Error procesando la reserva" },
      { status: 500 }
    )
  }
}
