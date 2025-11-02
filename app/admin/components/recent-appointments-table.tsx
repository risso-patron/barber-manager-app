interface RecentAppointment {
  id: string
  client_name: string
  service_name: string
  appointment_date: string
  status: string
}

interface RecentAppointmentsTableProps {
  appointments: RecentAppointment[]
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  completed: { bg: '#d1fae5', text: '#059669' },
  confirmed: { bg: '#dbeafe', text: '#2563eb' },
  pending: { bg: '#fef3c7', text: '#d97706' },
  cancelled: { bg: '#fee2e2', text: '#dc2626' }
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completada',
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  cancelled: 'Cancelada'
}

export function RecentAppointmentsTable({ appointments }: RecentAppointmentsTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '1rem'
      }}>
        Citas Recientes
      </h2>

      {appointments.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
          No hay citas registradas
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontSize: '0.875rem' }}>
                  Cliente
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontSize: '0.875rem' }}>
                  Servicio
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontSize: '0.875rem' }}>
                  Fecha
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontSize: '0.875rem' }}>
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => {
                const statusStyle = STATUS_COLORS[apt.status] || STATUS_COLORS.pending
                const statusLabel = STATUS_LABELS[apt.status] || apt.status

                return (
                  <tr key={apt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', color: '#1e293b' }}>
                      {apt.client_name}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>
                      {apt.service_name}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>
                      {formatDate(apt.appointment_date)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: statusStyle.bg,
                        color: statusStyle.text
                      }}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
