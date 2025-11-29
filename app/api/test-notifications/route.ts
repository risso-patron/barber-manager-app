import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { Twilio } from 'twilio';

export async function GET() {
  const results = {
    email: { success: false, message: '', data: null as any },
    whatsapp: { success: false, message: '', data: null as any },
  };

  // Prueba de Email
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (!RESEND_API_KEY) {
      results.email.message = 'RESEND_API_KEY no configurado';
    } else {
      const resend = new Resend(RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: ['delivered@resend.dev'],
        subject: '✅ Prueba de Notificaciones - Barber Manager',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">🎉 ¡Email funcionando!</h2>
            <p>Tu sistema de notificaciones por email está configurado correctamente.</p>
            <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Detalles de la prueba:</strong></p>
              <ul>
                <li>Servicio: Resend</li>
                <li>Desde: ${RESEND_FROM_EMAIL}</li>
                <li>Fecha: ${new Date().toLocaleString('es-PA')}</li>
              </ul>
            </div>
            <p style="color: #6B7280; font-size: 14px;">
              Este email fue enviado automáticamente desde Barber Manager App.
            </p>
          </div>
        `,
      });

      if (error) {
        results.email.message = error.message || 'Error desconocido';
      } else {
        results.email.success = true;
        results.email.message = 'Email enviado exitosamente';
        results.email.data = { id: data?.id };
      }
    }
  } catch (error) {
    results.email.message = error instanceof Error ? error.message : 'Error desconocido';
  }

  // Prueba de WhatsApp
  try {
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
    const TWILIO_TEST_TO = process.env.TWILIO_TEST_TO;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM || !TWILIO_TEST_TO) {
      const missing = [];
      if (!TWILIO_ACCOUNT_SID) missing.push('TWILIO_ACCOUNT_SID');
      if (!TWILIO_AUTH_TOKEN) missing.push('TWILIO_AUTH_TOKEN');
      if (!TWILIO_WHATSAPP_FROM) missing.push('TWILIO_WHATSAPP_FROM');
      if (!TWILIO_TEST_TO) missing.push('TWILIO_TEST_TO');
      results.whatsapp.message = `Faltan variables: ${missing.join(', ')}`;
    } else {
      const client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      
      const message = await client.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: TWILIO_TEST_TO,
        body: `✅ ¡WhatsApp funcionando!

🎉 Tu sistema de notificaciones está configurado correctamente.

*Detalles de la prueba:*
• Servicio: Twilio WhatsApp
• Desde: ${TWILIO_WHATSAPP_FROM}
• Fecha: ${new Date().toLocaleString('es-PA')}

Este mensaje fue enviado automáticamente desde Barber Manager App.`
      });

      results.whatsapp.success = true;
      results.whatsapp.message = 'WhatsApp enviado exitosamente';
      results.whatsapp.data = {
        sid: message.sid,
        status: message.status,
      };
    }
  } catch (error: any) {
    results.whatsapp.message = error.message || 'Error desconocido';
    if (error.code) results.whatsapp.data = { code: error.code };
  }

  return NextResponse.json({
    success: results.email.success && results.whatsapp.success,
    results,
    timestamp: new Date().toISOString(),
  });
}
