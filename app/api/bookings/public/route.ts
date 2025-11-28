import { NextRequest, NextResponse } from "next/server"

/**
 * API Route para crear reservas desde el enlace público
 * POST /api/bookings/public
 */

interface PublicBookingRequest {
  barbershop: string
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

    // Crear la reserva en la base de datos
    // TODO: Integrar con Supabase o tu base de datos
    const booking = {
      id: `booking-${Date.now()}`,
      barbershop: data.barbershop,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      date: data.date,
      time: data.time,
      duration: data.duration,
      price: data.price,
      notes: data.notes,
      status: "pending",
      createdAt: new Date().toISOString(),
      source: "public_link"
    }

    console.log("📝 Nueva reserva pública creada:", booking)

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

    // TODO: Consultar base de datos
    const bookings = [
      // Ejemplo de datos
      {
        id: "1",
        serviceName: "Corte de Cabello",
        employeeName: "Carlos Pérez",
        date: "2024-12-01",
        time: "15:00",
        status: "confirmed",
        price: 25
      }
    ]

    return NextResponse.json({
      success: true,
      bookings
    })

  } catch (error) {
    console.error("Error obteniendo reservas:", error)
    return NextResponse.json(
      { success: false, error: "Error obteniendo reservas" },
      { status: 500 }
    )
  }
}
