import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import twilio from 'twilio';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { reason, clientName, clientEmail, clientPhone, appointment } = body;

    // Actualizar estado en la base de datos
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { error: dbError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (dbError) {
      console.error('❌ Error cancelando cita en DB:', dbError);
      return NextResponse.json(
        { success: false, error: dbError.message },
        { status: 400 }
      );
    }

    console.log('📅 Cita cancelada en DB:', { id, reason: reason || 'Sin motivo' });

    // Preparar detalles para las notificaciones
    const appointmentDate = new Date(appointment.date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // 1. Enviar email de confirmación al cliente
    let emailSent = false;
    if (clientEmail) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: clientEmail,
          subject: '❌ Cita Cancelada - Barber Manager',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Cita Cancelada</h2>
              
              <p>Hola <strong>${clientName}</strong>,</p>
              
              <p>Tu cita ha sido cancelada exitosamente.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Detalles de la Cita Cancelada:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li>📅 <strong>Fecha:</strong> ${appointmentDate}</li>
                  <li>🕐 <strong>Hora:</strong> ${appointment.time}</li>
                  <li>✂️ <strong>Servicio:</strong> ${appointment.serviceName}</li>
                  <li>👤 <strong>Barbero:</strong> ${appointment.employeeName}</li>
                </ul>
                ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
              </div>
              
              <p>Esperamos verte pronto. Puedes agendar una nueva cita cuando lo desees.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Este es un mensaje automático de Barber Manager
                </p>
              </div>
            </div>
          `
        });
        emailSent = true;
        console.log('✅ Email enviado al cliente');
      } catch (emailError) {
        console.error('❌ Error enviando email al cliente:', emailError);
      }
    }

    // 2. Notificar al barbero por WhatsApp
    let whatsappSent = false;
    try {
      const barberPhone = process.env.TWILIO_TEST_TO; // En producción, usar el teléfono real del barbero
      
      if (barberPhone) {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: barberPhone,
          body: `❌ CITA CANCELADA

Cliente: ${clientName}
Servicio: ${appointment.serviceName}
Fecha: ${appointmentDate}
Hora: ${appointment.time}
${reason ? `\nMotivo: ${reason}` : ''}

Este espacio ahora está disponible para otros clientes.`
        });
        whatsappSent = true;
        console.log('✅ WhatsApp enviado al barbero');
      }
    } catch (whatsappError) {
      console.error('❌ Error enviando WhatsApp al barbero:', whatsappError);
    }

    // 3. Notificar al cliente por WhatsApp (confirmación)
    let clientWhatsappSent = false;
    if (clientPhone) {
      try {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: `whatsapp:${clientPhone}`,
          body: `✅ Cita Cancelada - Barber Manager

Hola ${clientName},

Tu cita ha sido cancelada:

📅 Fecha: ${appointmentDate}
🕐 Hora: ${appointment.time}
✂️ Servicio: ${appointment.serviceName}
👤 Barbero: ${appointment.employeeName}

¡Esperamos verte pronto! Puedes agendar una nueva cita cuando lo desees.`
        });
        clientWhatsappSent = true;
        console.log('✅ WhatsApp enviado al cliente');
      } catch (whatsappError) {
        console.error('❌ Error enviando WhatsApp al cliente:', whatsappError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cita cancelada exitosamente',
      notifications: {
        email: emailSent,
        barberWhatsapp: whatsappSent,
        clientWhatsapp: clientWhatsappSent
      }
    });

  } catch (error) {
    console.error('Error cancelando cita:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al cancelar la cita' 
      },
      { status: 500 }
    );
  }
}
