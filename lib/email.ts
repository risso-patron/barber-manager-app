// Utility para enviar emails de confirmación de citas

interface AppointmentEmailData {
  clientName: string
  clientEmail: string
  service: string
  barberName: string
  date: string
  time: string
  notes?: string
}

interface EmailResponse {
  success: boolean
  error?: string
}

export async function sendAppointmentConfirmation(
  data: AppointmentEmailData
): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'appointment-confirmation',
        to: data.clientEmail,
        data: {
          clientName: data.clientName,
          service: data.service,
          barberName: data.barberName,
          date: data.date,
          time: data.time,
          notes: data.notes,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Error al enviar email' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message || 'Error de red' }
  }
}

export async function sendAppointmentStatusUpdate(
  data: AppointmentEmailData & { status: 'confirmed' | 'cancelled' | 'completed' }
): Promise<EmailResponse> {
  try {
    const typeMap = {
      confirmed: 'appointment-confirmed',
      cancelled: 'appointment-cancelled',
      completed: 'appointment-completed',
    }

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: typeMap[data.status],
        to: data.clientEmail,
        data: {
          clientName: data.clientName,
          service: data.service,
          barberName: data.barberName,
          date: data.date,
          time: data.time,
          status: data.status,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Error al enviar email' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error sending status email:', error)
    return { success: false, error: error.message || 'Error de red' }
  }
}
