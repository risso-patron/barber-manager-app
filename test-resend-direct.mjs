import { Resend } from 'resend'

const resend = new Resend('re_cjzxTsxd_DhTwvaU4puFA4YL8EErwTG8q')

async function testResend() {
  try {
    console.log('🔍 Probando conexión con Resend...')
    
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['luisrissopa@gmail.com'],
      subject: 'Test desde Barber Manager',
      html: '<h1>¡Hola! Este es un email de prueba</h1><p>Si ves esto, el sistema funciona correctamente.</p>',
    })

    if (error) {
      console.error('❌ Error de Resend:', error)
      return
    }

    console.log('✅ Email enviado exitosamente!')
    console.log('📊 Respuesta:', data)
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

testResend()
