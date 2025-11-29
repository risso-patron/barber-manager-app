/**
 * Script de prueba para verificar notificaciones de Email y WhatsApp
 * Ejecutar con: node scripts/test-notifications.mjs
 */

import { Resend } from 'resend';
import { Twilio } from 'twilio';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const TWILIO_TEST_TO = process.env.TWILIO_TEST_TO;

async function testEmail() {
  console.log('\n📧 Probando Email (Resend)...');
  
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY no configurado');
    return false;
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: ['delivered@resend.dev'], // Email de prueba de Resend
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
      console.error('❌ Error enviando email:', error);
      return false;
    }

    console.log('✅ Email enviado exitosamente!');
    console.log('   ID:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testWhatsApp() {
  console.log('\n📱 Probando WhatsApp (Twilio)...');
  
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM || !TWILIO_TEST_TO) {
    console.error('❌ Credenciales de Twilio incompletas');
    console.log('   Configuradas:');
    console.log('   - TWILIO_ACCOUNT_SID:', TWILIO_ACCOUNT_SID ? '✅' : '❌');
    console.log('   - TWILIO_AUTH_TOKEN:', TWILIO_AUTH_TOKEN ? '✅' : '❌');
    console.log('   - TWILIO_WHATSAPP_FROM:', TWILIO_WHATSAPP_FROM || '❌');
    console.log('   - TWILIO_TEST_TO:', TWILIO_TEST_TO || '❌');
    return false;
  }

  try {
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

    console.log('✅ WhatsApp enviado exitosamente!');
    console.log('   SID:', message.sid);
    console.log('   Estado:', message.status);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('   Código:', error.code);
    if (error.moreInfo) console.error('   Más info:', error.moreInfo);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de notificaciones...\n');
  console.log('═══════════════════════════════════════════');
  
  const emailOk = await testEmail();
  const whatsappOk = await testWhatsApp();
  
  console.log('\n═══════════════════════════════════════════');
  console.log('\n📊 Resultados:');
  console.log(`   Email: ${emailOk ? '✅ OK' : '❌ FALLÓ'}`);
  console.log(`   WhatsApp: ${whatsappOk ? '✅ OK' : '❌ FALLÓ'}`);
  
  if (emailOk && whatsappOk) {
    console.log('\n🎉 ¡Todas las notificaciones funcionan correctamente!');
  } else {
    console.log('\n⚠️  Algunas notificaciones fallaron. Revisa los errores arriba.');
  }
}

main().catch(console.error);
