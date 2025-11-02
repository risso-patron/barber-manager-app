import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { AppointmentConfirmationEmail } from '@/emails/appointment-confirmation'
import { AppointmentStatusEmail } from '@/emails/appointment-status'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, to, data } = body

    let emailComponent
    let subject = ''

    switch (type) {
      case 'appointment-confirmation':
        emailComponent = AppointmentConfirmationEmail(data)
        subject = `Confirmación de Cita - ${data.service}`
        break
      
      case 'appointment-confirmed':
        emailComponent = AppointmentStatusEmail({ ...data, status: 'confirmed' })
        subject = 'Tu cita ha sido confirmada ✅'
        break
      
      case 'appointment-cancelled':
        emailComponent = AppointmentStatusEmail({ ...data, status: 'cancelled' })
        subject = 'Tu cita ha sido cancelada'
        break
      
      case 'appointment-completed':
        emailComponent = AppointmentStatusEmail({ ...data, status: 'completed' })
        subject = '¡Gracias por tu visita! 💈'
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    const { data: emailData, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject,
      react: emailComponent,
    })

    if (error) {
      console.error('Error sending email:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: emailData })
  } catch (error: any) {
    console.error('Error in send-email route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
