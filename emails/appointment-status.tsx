import * as React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from '@react-email/components'

interface AppointmentStatusEmailProps {
  clientName: string
  service: string
  barberName: string
  date: string
  time: string
  status: 'confirmed' | 'cancelled' | 'completed'
}

export const AppointmentStatusEmail = ({
  clientName = 'Cliente',
  service = 'Corte de Cabello',
  barberName = 'Barbero',
  date = '15 de Noviembre, 2025',
  time = '10:00 AM',
  status = 'confirmed',
}: AppointmentStatusEmailProps) => {
  const statusConfig = {
    confirmed: {
      emoji: '✅',
      title: 'Tu cita ha sido confirmada',
      message: 'Nos vemos pronto! Tu cita ha sido confirmada y está lista.',
      color: '#10b981',
    },
    cancelled: {
      emoji: '❌',
      title: 'Tu cita ha sido cancelada',
      message: 'Tu cita ha sido cancelada. Si deseas reagendar, contáctanos.',
      color: '#ef4444',
    },
    completed: {
      emoji: '🎉',
      title: '¡Gracias por tu visita!',
      message: 'Esperamos que hayas disfrutado tu servicio. ¡Te esperamos pronto!',
      color: '#8b5cf6',
    },
  }

  const config = statusConfig[status]

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>💈 Barber Manager</Heading>
          </Section>

          <Section style={content}>
            <Text style={{ ...emoji, color: config.color }}>{config.emoji}</Text>
            <Heading style={h2}>{config.title}</Heading>
            
            <Text style={text}>
              Hola <strong>{clientName}</strong>,
            </Text>
            
            <Text style={text}>
              {config.message}
            </Text>

            {status !== 'cancelled' && (
              <Section style={detailsBox}>
                <Text style={detailRow}>
                  <strong>Servicio:</strong> {service}
                </Text>
                <Text style={detailRow}>
                  <strong>Barbero:</strong> {barberName}
                </Text>
                <Text style={detailRow}>
                  <strong>Fecha:</strong> {date}
                </Text>
                <Text style={detailRow}>
                  <strong>Hora:</strong> {time}
                </Text>
              </Section>
            )}

            {status === 'completed' && (
              <>
                <Hr style={hr} />
                <Text style={text}>
                  Nos encantaría conocer tu opinión. ¿Cómo fue tu experiencia?
                </Text>
              </>
            )}

            <Hr style={hr} />

            <Text style={footer}>
              ¿Necesitas ayuda? Contáctanos en cualquier momento.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default AppointmentStatusEmail

// Estilos
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  backgroundColor: '#667eea',
  padding: '24px',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
}

const content = {
  padding: '0 48px',
}

const emoji = {
  fontSize: '48px',
  textAlign: 'center' as const,
  margin: '24px 0',
}

const h2 = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const detailsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e2e8f0',
}

const detailRow = {
  color: '#1e293b',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
}

const footer = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
}
