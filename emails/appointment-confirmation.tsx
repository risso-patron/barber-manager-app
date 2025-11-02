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
  Button,
} from '@react-email/components'

interface AppointmentConfirmationEmailProps {
  clientName: string
  service: string
  barberName: string
  date: string
  time: string
  notes?: string
}

export const AppointmentConfirmationEmail = ({
  clientName = 'Cliente',
  service = 'Corte de Cabello',
  barberName = 'Barbero',
  date = '15 de Noviembre, 2025',
  time = '10:00 AM',
  notes,
}: AppointmentConfirmationEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>💈 Barber Manager</Heading>
        </Section>

        <Section style={content}>
          <Heading style={h2}>¡Cita Confirmada!</Heading>
          
          <Text style={text}>
            Hola <strong>{clientName}</strong>,
          </Text>
          
          <Text style={text}>
            Tu cita ha sido registrada exitosamente. A continuación los detalles:
          </Text>

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
            {notes && (
              <Text style={detailRow}>
                <strong>Notas:</strong> {notes}
              </Text>
            )}
          </Section>

          <Text style={text}>
            Recibirás un recordatorio 24 horas antes de tu cita.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Si necesitas cancelar o reprogramar tu cita, por favor contáctanos.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default AppointmentConfirmationEmail

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

const h2 = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '24px 0',
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
