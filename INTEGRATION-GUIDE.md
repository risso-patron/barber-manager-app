# 🚀 Guía de Integración - Fase 1: Paridad

Esta guía te ayudará a completar las integraciones críticas para alcanzar paridad con Barbería Club.

## 📧 1. Integración de Email (RESEND - Recomendado)

### ¿Por qué Resend?
- ✅ **Gratis**: 3,000 emails/mes en plan gratuito
- ✅ **Fácil**: Configuración en 5 minutos
- ✅ **Confiable**: 99.9% deliverability
- ✅ **Moderno**: API simple y bien documentada

### Paso 1: Crear cuenta en Resend
1. Ve a https://resend.com
2. Regístrate con tu email
3. Verifica tu cuenta

### Paso 2: Obtener API Key
1. Dashboard → API Keys
2. Create API Key
3. Copia la key (empieza con `re_`)

### Paso 3: Instalar dependencia
```bash
npm install resend
```

### Paso 4: Configurar variables de entorno
Crea/actualiza `.env.local`:
```env
RESEND_API_KEY=re_tu_api_key_aqui
RESEND_FROM_EMAIL=noreply@tudominio.com
```

### Paso 5: Actualizar el código
En `app/api/notifications/send/route.ts`, descomenta la sección de Resend:

```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

async function sendEmail(data: BookingNotification) {
  if (!data.clientEmail) return false
  
  try {
    await resend.emails.send({
      from: 'Barbería <noreply@tudominio.com>',
      to: data.clientEmail,
      subject: getEmailSubject(data.type),
      html: generateEmailBody(data)
    })
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}
```

### Paso 6: Verificar dominio (Opcional para producción)
1. Resend Dashboard → Domains
2. Add Domain
3. Agrega registros DNS (MX, TXT, CNAME)
4. Verifica

---

## 💬 2. Integración de WhatsApp Business API

### Opción A: Meta WhatsApp Cloud API (GRATIS - Recomendado)

#### Ventajas
- ✅ **Gratis**: 1,000 conversaciones/mes
- ✅ **Oficial**: Directamente de Meta
- ✅ **Escalable**: Sin límites técnicos

#### Desventajas
- ⚠️ Configuración más compleja
- ⚠️ Requiere Facebook Business Account
- ⚠️ Proceso de verificación

#### Pasos:
1. Ve a https://developers.facebook.com
2. Crea una App → WhatsApp
3. Configura WhatsApp Business Account
4. Obtén Phone Number ID y Access Token
5. Configura Webhook para recibir mensajes

```bash
npm install @meta-business-sdk/whatsapp
```

```typescript
import { WhatsAppAPI } from '@meta-business-sdk/whatsapp'

const whatsapp = new WhatsAppAPI({
  phoneNumberId: process.env.WHATSAPP_PHONE_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN
})

async function sendWhatsApp(data: BookingNotification) {
  try {
    await whatsapp.sendMessage({
      to: data.clientPhone,
      type: 'text',
      text: { body: generateWhatsAppMessage(data) }
    })
    return true
  } catch (error) {
    console.error('Error sending WhatsApp:', error)
    return false
  }
}
```

---

### Opción B: Twilio (MÁS FÁCIL - Para empezar)

#### Ventajas
- ✅ **Fácil**: Setup en 10 minutos
- ✅ **Sandbox gratuito**: Para desarrollo
- ✅ **Bien documentado**: Mucha info disponible

#### Desventajas
- ⚠️ **Pago**: ~$0.005 por mensaje en producción
- ⚠️ Requiere verificación de números

#### Pasos:
1. Ve a https://www.twilio.com
2. Crea cuenta (incluye crédito de prueba)
3. WhatsApp → Get Started
4. Sigue instrucciones del Sandbox

```bash
npm install twilio
```

```typescript
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

async function sendWhatsApp(data: BookingNotification) {
  try {
    await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio Sandbox
      to: `whatsapp:${data.clientPhone}`,
      body: generateWhatsAppMessage(data)
    })
    return true
  } catch (error) {
    console.error('Error sending WhatsApp:', error)
    return false
  }
}
```

#### Variables de entorno:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

### Opción C: Alternativas (Más simples, menos confiables)

#### Ultramsg (https://ultramsg.com)
- 💰 $10/mes
- ✅ Fácil de usar
- ⚠️ Menos confiable

#### WAHA (WhatsApp HTTP API)
- ✅ Gratis y open source
- ⚠️ Requiere servidor propio
- ⚠️ Puede ser bloqueado por WhatsApp

---

## 🔔 3. Sistema de Recordatorios Automáticos

### Usar Cron Jobs con Vercel Cron

#### Paso 1: Crear función de recordatorios
```typescript
// app/api/cron/reminders/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verificar autorización
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Obtener citas de mañana
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  // TODO: Consultar BD
  const appointments = [] // Citas de mañana

  // Enviar recordatorios
  for (const apt of appointments) {
    await fetch('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify({
        type: 'reminder',
        ...apt
      })
    })
  }

  return NextResponse.json({ sent: appointments.length })
}
```

#### Paso 2: Configurar en vercel.json
```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "0 9 * * *"
  }]
}
```

#### Paso 3: Variables de entorno
```env
CRON_SECRET=tu_secreto_aleatorio_muy_seguro
```

---

## 📱 4. Mejoras UX Implementadas

### ✅ Ya implementado:
- [x] Enlace público de reservas `/book/[slug]`
- [x] Proceso de reserva paso a paso (5 pasos)
- [x] Validación de formularios
- [x] Confirmación visual de reserva
- [x] Loading states automáticos
- [x] Página de compartir con QR
- [x] APIs RESTful listas

### 📋 Próximos pasos UX:
- [ ] Agregar loading spinners en botones
- [ ] Animaciones de transición entre pasos
- [ ] Feedback visual mejorado
- [ ] Modo oscuro
- [ ] PWA (Progressive Web App)

---

## 🎯 Checklist de Implementación

### Prioridad Alta 🔴
- [ ] Configurar Resend para emails
- [ ] Configurar WhatsApp (Twilio Sandbox para empezar)
- [ ] Probar flujo completo de reserva pública
- [ ] Verificar notificaciones funcionando

### Prioridad Media 🟡
- [ ] Sistema de recordatorios con cron
- [ ] Migrar de Twilio a Meta WhatsApp API
- [ ] Verificar dominio en Resend
- [ ] Templates de email personalizados

### Prioridad Baja 🟢
- [ ] Analytics de reservas
- [ ] A/B testing de landing page
- [ ] Multi-idioma
- [ ] Integración con Google Calendar

---

## 🧪 Testing

### Probar Email:
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "confirmation",
    "clientName": "Test User",
    "clientEmail": "test@example.com",
    "clientPhone": "+1234567890",
    "serviceName": "Corte",
    "employeeName": "Carlos",
    "date": "2024-12-01",
    "time": "15:00",
    "price": 25,
    "barbershopName": "Mi Barbería",
    "barbershopPhone": "+1555123456"
  }'
```

### Probar Reserva Pública:
1. Visita: `http://localhost:3000/book/mi-barberia`
2. Completa todos los pasos
3. Verifica consola para logs
4. Verifica email/WhatsApp recibidos

---

## 🆘 Soporte

### Recursos:
- **Resend Docs**: https://resend.com/docs
- **Twilio Docs**: https://www.twilio.com/docs/whatsapp
- **Meta WhatsApp**: https://developers.facebook.com/docs/whatsapp
- **Vercel Cron**: https://vercel.com/docs/cron-jobs

### Errores Comunes:

#### Email no llega:
1. Verifica API key en `.env.local`
2. Revisa spam/junk
3. Verifica dominio verificado en Resend
4. Chequea logs en Resend dashboard

#### WhatsApp falla:
1. Verifica formato de teléfono (+código país)
2. En Twilio Sandbox, número debe estar registrado
3. Verifica credenciales
4. Chequea balance en Twilio

---

## 💡 Pro Tips

1. **Desarrollo**: Usa Twilio Sandbox + Resend gratuito
2. **Producción**: Migra a Meta WhatsApp API cuando escales
3. **Logs**: Siempre loguea intentos de envío
4. **Fallback**: Si WhatsApp falla, envía email
5. **Testing**: Crea endpoint `/api/test/notifications` para pruebas

---

## 🚀 Siguiente Nivel

Una vez implementado todo esto, considera:

1. **Webhooks**: Recibir respuestas de WhatsApp
2. **Chatbot**: Automatizar respuestas comunes
3. **Pagos**: Integrar Stripe/MercadoPago
4. **SMS**: Fallback si WhatsApp falla
5. **Push Notifications**: Para app móvil

---

**Tiempo estimado de implementación completa**: 4-6 horas

**Inversión inicial**: $0 (todo gratis para empezar)

**¿Necesitas ayuda?** Revisa los docs o pregunta en la comunidad.
