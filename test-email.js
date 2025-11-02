// Script de prueba para enviar email
const testEmail = async () => {
  try {
    console.log('🔍 Probando envío de email...')
    console.log('📧 Enviando a: luisrissopa@gmail.com')
    
    const response = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'appointment-confirmation',
        to: 'luisrissopa@gmail.com',
        data: {
          clientName: 'Luis Rissopa',
          service: 'Corte de Cabello',
          barberName: 'Carlos Pérez',
          date: 'sábado, 2 de noviembre de 2025',
          time: '10:00 AM',
          notes: 'Prueba del sistema de emails'
        }
      })
    })

    const result = await response.json()
    
    console.log('\n📊 Respuesta del servidor:')
    console.log('Status:', response.status)
    console.log('Data:', JSON.stringify(result, null, 2))

    if (response.ok) {
      console.log('\n✅ Email enviado exitosamente!')
      console.log('📬 Revisa tu bandeja de entrada en: luisrissopa@gmail.com')
    } else {
      console.log('\n❌ Error al enviar email:')
      console.log(result.error)
    }
  } catch (error) {
    console.error('\n💥 Error en la petición:', error.message)
  }
}

testEmail()
