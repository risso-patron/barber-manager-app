"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast'

interface ClientProfileProps {
  clientId: string
  onBack: () => void
}

interface Client {
  id: string
  name: string | null
  email: string
  phone: string | null
  is_active: boolean
  created_at: string
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  notes: string | null
  service: {
    name: string
    price: number
  } | null
  employee: {
    name: string | null
    email: string
  } | null
}

export function ClientProfileView({ clientId, onBack }: ClientProfileProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'appointments' | 'purchases'>('info')

  useEffect(() => {
    loadClientData()
  }, [clientId])

  const loadClientData = async () => {
    const supabase = createClient()
    
    // Cargar datos del cliente
    const { data: clientData, error: clientError } = await supabase
      .from('users')
      .select('id, name, email, phone, is_active, created_at')
      .eq('id', clientId)
      .single()

    if (clientError) {
      console.error('Error cargando cliente:', clientError)
      toast.error('Error al cargar los datos del cliente')
      return
    }

    setClient(clientData)

    // Cargar historial de citas
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        service:service_id (
          name,
          price
        ),
        employee:barber_id (
          name,
          email
        )
      `)
      .eq('client_id', clientId)
      .order('appointment_date', { ascending: false })

    if (!appointmentsError && appointmentsData) {
      setAppointments(appointmentsData)
    }

    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
      case 'completed':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      case 'cancelled':
        return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
      default:
        return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada'
      case 'completed': return 'Completada'
      case 'cancelled': return 'Cancelada'
      case 'pending': return 'Pendiente'
      default: return status
    }
  }

  // Calcular el total gastado (solo citas completadas)
  const totalSpent = appointments
    .filter(apt => apt.status === 'completed' && apt.service?.price)
    .reduce((sum, apt) => sum + (apt.service?.price || 0), 0)

  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter(a => a.status === 'completed').length
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#64748b' }}>Cliente no encontrado</p>
        <button onClick={onBack} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
          Volver
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header con botón de volver */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={onBack}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'white',
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: '0.5rem',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ← Volver a Clientes
        </button>
      </div>

      {/* Información del cliente */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              fontWeight: 'bold',
              color: 'white',
              flexShrink: 0
            }}
          >
            {client.name?.[0]?.toUpperCase() || client.email[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
              {client.name || client.email}
            </h1>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#64748b' }}>
              <span>📧 {client.email}</span>
              {client.phone && <span>📱 {client.phone}</span>}
              <span>📅 Cliente desde {new Date(client.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <span style={{
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                fontWeight: '600',
                background: client.is_active 
                  ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                  : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white'
              }}>
                {client.is_active ? '✅ Activo' : '⏸️ Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>{totalAppointments}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Total Citas</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#43e97b' }}>{completedAppointments}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Completadas</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff6b6b' }}>{cancelledAppointments}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Canceladas</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
              ${totalSpent.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', marginTop: '0.25rem' }}>Total Gastado</div>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #f1f5f9', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('info')}
            style={{
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'info' ? '3px solid #667eea' : '3px solid transparent',
              color: activeTab === 'info' ? '#667eea' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            📋 Información
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            style={{
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'appointments' ? '3px solid #667eea' : '3px solid transparent',
              color: activeTab === 'appointments' ? '#667eea' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            📅 Historial de Citas ({totalAppointments})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            style={{
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'purchases' ? '3px solid #667eea' : '3px solid transparent',
              color: activeTab === 'purchases' ? '#667eea' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            🛒 Compras (0)
          </button>
        </div>

        {/* Contenido de pestañas */}
        {activeTab === 'info' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
              Información Personal
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Nombre Completo</div>
                <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>{client.name || 'No especificado'}</div>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Email</div>
                <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>{client.email}</div>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Teléfono</div>
                <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>{client.phone || 'No especificado'}</div>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Estado</div>
                <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>{client.is_active ? 'Activo' : 'Inactivo'}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
              Historial de Citas
            </h3>
            {appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                <p style={{ color: '#64748b' }}>No hay citas registradas para este cliente</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    style={{
                      padding: '1.5rem',
                      background: '#f8fafc',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                          {appointment.service?.name || 'Servicio no especificado'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          📅 {new Date(appointment.appointment_date).toLocaleDateString('es-ES', { 
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} - {appointment.appointment_time}
                        </div>
                        {appointment.service?.price && (
                          <div style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '600', marginTop: '0.5rem' }}>
                            💰 Precio: ${appointment.service.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        fontWeight: '600',
                        background: getStatusColor(appointment.status),
                        color: 'white'
                      }}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    {appointment.employee && (
                      <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        👤 Atendido por: {appointment.employee.name || appointment.employee.email}
                      </div>
                    )}
                    {appointment.notes && (
                      <div style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: '0.5rem' }}>
                        💬 {appointment.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'purchases' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
              Historial de Compras
            </h3>
            <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
              <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>Módulo de compras en desarrollo</p>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Aquí aparecerá el historial de productos comprados por el cliente</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
