import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Crear el appointment en Supabase
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

    // Enviar notificaciones
    try {
      await fetch(`${request.nextUrl.origin}/api/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new_booking",
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone,
          serviceName: data.serviceName,
          employeeName: data.employeeName,
          date: data.date,
          time: data.time,
          price: data.price,
          barbershopName: data.barbershop.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          barbershopPhone: "+1 (555) 123-4567" // TODO: Obtener de la BD
        })
      })
    } catch (error) {
      console.error("Error enviando notificaciones:", error)
      // No fallar la reserva si las notificaciones fallan
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

    const formatted = (bookings || []).map((b: any) => ({
      id: b.id,
      serviceName: b.services?.name,
      employeeName: b.users?.name,
      date: b.appointment_date,
      time: b.appointment_time,
      status: b.status,
      price: b.services?.price,
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
