import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

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

    // Validar conflictos de horarios (no puede existir otro appointment para el mismo empleado, fecha y hora)
    const { data: conflictingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("barber_id", data.employeeId)
      .eq("appointment_date", data.date)
      .eq("appointment_time", data.time)
      .maybeSingle()

    if (conflictingAppointment) {
      return NextResponse.json(
        { success: false, error: "Este horario ya está reservado. Por favor elige otro." },
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

    // Encolar notificación (procesada de forma asíncrona por la Edge Function)
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

/**
 * GET /api/bookings/public?phone=xxx
 * Obtener reservas por teléfono (para clientes sin cuenta)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get("phone")

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Teléfono requerido" },
        { status: 400 }
      )
    }

    const hasSupabaseConfig = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    if (!hasSupabaseConfig) {
      return NextResponse.json({ success: true, bookings: [] })
    }

    const supabase = createAdminSupabaseClient()

    // Buscar cliente por teléfono
    const { data: client } = await supabase
      .from("users")
      .select("id")
      .eq("phone", phone)
      .eq("role", "client")
      .maybeSingle()

    if (!client) {
      return NextResponse.json({ success: true, bookings: [] })
    }

    const { data: bookings, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        services ( name, price ),
        users!appointments_barber_id_fkey ( name )
      `)
      .eq("client_id", client.id)
      .order("appointment_date", { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: "Error consultando reservas" }, { status: 500 })
    }

    interface BookingRow {
      id: string
      appointment_date: string
      appointment_time: string
      status: string
      notes?: string | null
      services?: { name?: string; price?: number }[] | null
      users?: { name?: string }[] | null
    }
    const formatted = (bookings as unknown as BookingRow[] || []).map((b) => ({
      id: b.id,
      serviceName: b.services?.[0]?.name,
      employeeName: b.users?.[0]?.name,
      date: b.appointment_date,
      time: b.appointment_time,
      status: b.status,
      price: b.services?.[0]?.price,
    }))

    return NextResponse.json({
      success: true,
      bookings: formatted
    })

  } catch (error) {
    console.error("Error obteniendo reservas:", error)
    return NextResponse.json(
      { success: false, error: "Error obteniendo reservas" },
      { status: 500 }
    )
  }
}
