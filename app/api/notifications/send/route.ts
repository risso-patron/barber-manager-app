import { NextRequest, NextResponse } from "next/server"

interface BookingNotification {
  type: "new_booking" | "confirmation" | "reminder" | "cancellation" | "reschedule"
  clientName: string
  clientEmail?: string
  employeeEmail?: string
  clientPhone: string
  serviceName: string
  employeeName: string
  date: string
  time: string
  price: number
  barbershopName: string
  barbershopPhone: string
  reason?: string | null
  previousDate?: string
  previousTime?: string
}

export async function POST(request: NextRequest) {
  try {
    const data: BookingNotification = await request.json()

    console.log("📧 Notificación de Email:", {
      to: data.clientEmail,
      subject: getEmailSubject(data.type),
      body: generateEmailBody(data)
    })

    console.log("📱 Notificación de WhatsApp:", {
      to: data.clientPhone,
      message: generateWhatsAppMessage(data)
    })

    return NextResponse.json({
      success: true,
      message: "Notificaciones enviadas",
      channels: {
        email: data.clientEmail ? "sent" : "skipped",
        whatsapp: "sent"
      }
    })

  } catch (error) {
    console.error("Error enviando notificaciones:", error)
    return NextResponse.json(
      { success: false, error: "Error enviando notificaciones" },
      { status: 500 }
    )
  }
}

function getEmailSubject(type: BookingNotification["type"]): string {
  switch (type) {
    case "new_booking":   return "✅ Nueva Reserva Recibida"
    case "confirmation":  return "✅ Tu Cita Ha Sido Confirmada"
    case "reminder":      return "⏰ Recordatorio de Tu Cita"
    case "cancellation":  return "❌ Cita Cancelada"
    case "reschedule":    return "📅 Cita Reprogramada"
    default:              return "Notificación de Barbería"
  }
}

function generateEmailBody(data: BookingNotification): string {
  const dateFormatted = new Date(data.date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { color: #6b7280; }
        .detail-value { font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 ${data.barbershopName}</h1>
        </div>
        <div class="content">
          <h2>¡Hola ${data.clientName}!</h2>
          <p>${getEmailMessage(data.type, data)}</p>
          
          <div class="booking-details">
            <h3>Detalles de tu Cita:</h3>
            <div class="detail-row">
              <span class="detail-label">Servicio:</span>
              <span class="detail-value">${data.serviceName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Barbero:</span>
              <span class="detail-value">${data.employeeName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha:</span>
              <span class="detail-value">${dateFormatted}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Hora:</span>
              <span class="detail-value">${data.time}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Precio:</span>
              <span class="detail-value">$${data.price}</span>
            </div>
          </div>

          <p><strong>¿Necesitas ayuda?</strong></p>
          <p>Contáctanos: ${data.barbershopPhone}</p>
        </div>
        <div class="footer">
          <p>Este es un email automático de ${data.barbershopName}</p>
          <p>Si no solicitaste esta cita, por favor contáctanos de inmediato.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ← CAMBIO 1: ahora recibe `data` como segundo parámetro
function getEmailMessage(type: BookingNotification["type"], data: BookingNotification): string {
  switch (type) {
    case "new_booking":
      return "Tu reserva ha sido recibida exitosamente. Te confirmaremos pronto."
    case "confirmation":
      return "Tu cita ha sido confirmada. ¡Te esperamos!"
    case "reminder":
      return "Este es un recordatorio de tu cita programada para mañana."
    case "cancellation":
      return "Tu cita ha sido cancelada. Si esto fue un error, por favor contáctanos."
    case "reschedule":
      // ← CAMBIO 2: ahora `data` está disponible aquí
      return `Tu cita ha sido reprogramada al ${new Date(data.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${data.time}.${data.reason ? ` Motivo: ${data.reason}` : ""}`
    default:
      return "Información sobre tu cita."
  }
}

function generateWhatsAppMessage(data: BookingNotification): string {
  const dateFormatted = new Date(data.date).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  return `
🎯 *${data.barbershopName}*

${getWhatsAppGreeting(data.type)}

✂️ *Servicio:* ${data.serviceName}
👨‍💼 *Barbero:* ${data.employeeName}
📅 *Fecha:* ${dateFormatted}
⏰ *Hora:* ${data.time}
💰 *Precio:* $${data.price}

${getWhatsAppFooter(data.type, data.barbershopPhone)}
  `.trim()
}

function getWhatsAppGreeting(type: BookingNotification["type"]): string {
  switch (type) {
    case "new_booking":  return "✅ *Tu reserva ha sido recibida*"
    case "confirmation": return "✅ *Tu cita está confirmada*"
    case "reminder":     return "⏰ *Recordatorio de tu cita de mañana*"
    case "cancellation": return "❌ *Tu cita ha sido cancelada*"
    case "reschedule":   return "📅 *Tu cita ha sido reprogramada*"
    default:             return "*Información de tu cita*"
  }
}

function getWhatsAppFooter(type: BookingNotification["type"], phone: string): string {
  if (type === "reminder") {
    return `Por favor confirma tu asistencia respondiendo este mensaje.\n\n📞 ${phone}`
  }
  return `¿Necesitas cambiar algo? Contáctanos:\n📞 ${phone}`
}