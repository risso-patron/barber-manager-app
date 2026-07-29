import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import twilio from 'twilio';
import { withRateLimit, strictLimiter } from '@/lib/rate-limit';
import { sanitizeHTML } from '@/lib/validation';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRateLimit(request, strictLimiter, async () => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // ── Autenticación (RH-002 · A3) ─────────────────────────────────────────
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const adminClient = createAdminSupabaseClient();

    // ── Cargar la cita real (nunca confiar en datos del body) ───────────────
    const { data: appointmentRow, error: fetchError } = await adminClient
      .from('appointments')
      .select(
        `id, client_id, status, appointment_date, appointment_time,
         client:users!appointments_client_id_fkey(id, name, email, phone),
         barber:users!appointments_barber_id_fkey(name),
         service:services(name)`
      )
      .eq('id', id)
      .single();

    if (fetchError || !appointmentRow) {
      return NextResponse.json({ success: false, error: 'Cita no encontrada' }, { status: 404 });
    }

    // ── Verificar permisos (solo el cliente dueño o admin) ──────────────────
    const { data: profile } = await adminClient.from('users').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';
    const isOwner = appointmentRow.client_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: 'Sin permiso para cancelar esta cita' }, { status: 403 });
    }

    const client = (appointmentRow as unknown as { client: { name: string; email: string; phone: string } | null }).client;
    const barber = (appointmentRow as unknown as { barber: { name: string } | null }).barber;
    const service = (appointmentRow as unknown as { service: { name: string } | null }).service;
    const clientName = client?.name ?? 'Cliente';
    const clientEmail = client?.email;
    const clientPhone = client?.phone ?? '';
    const appointment = {
      date: appointmentRow.appointment_date,
      time: appointmentRow.appointment_time,
      serviceName: service?.name ?? 'Servicio',
      employeeName: barber?.name ?? 'Barbero',
    };

    // Actualizar estado en la base de datos
    const { data: updated, error: dbError } = await adminClient
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (dbError || !updated) {
      console.error('❌ Error cancelando cita en DB:', dbError);
      return NextResponse.json(
        { success: false, error: dbError?.message ?? 'Error al cancelar la cita' },
        { status: 400 }
      );
    }

    console.log('📅 Cita cancelada en DB:', { id, reason: reason || 'Sin motivo' });

    // Preparar detalles para las notificaciones (reason es texto libre del
    // usuario ya autenticado — se sanitiza antes de interpolar en HTML)
    const safeReason = typeof reason === 'string' && reason.trim() ? sanitizeHTML(reason) : '';
    const appointmentDate = new Date(appointment.date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // 1. Enviar email de confirmación al cliente
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    let emailSent = false;
    if (clientEmail) {
      try {
        if (!resend) throw new Error('RESEND_API_KEY not configured');
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
                ${safeReason ? `<p><strong>Motivo:</strong> ${safeReason}</p>` : ''}
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
    const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
      ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : null;
    let whatsappSent = false;
    try {
      const barberPhone = process.env.TWILIO_TEST_TO; // En producción, usar el teléfono real del barbero
      
      if (barberPhone) {
        if (!twilioClient) throw new Error('Twilio not configured');
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: barberPhone,
          body: `❌ CITA CANCELADA

Cliente: ${clientName}
Servicio: ${appointment.serviceName}
Fecha: ${appointmentDate}
Hora: ${appointment.time}
${safeReason ? `\nMotivo: ${safeReason}` : ''}

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
        if (!twilioClient) throw new Error('Twilio not configured');
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
  });
}
