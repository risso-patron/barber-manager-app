"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { AppointmentSystem } from "@/components/appointments/appointment-system"
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  name: string | null
  email: string
  phone: string | null
  created_at: string
}

interface Appointment {
  id: string
  date: string
  status: string
  service_type: string | null
  notes: string | null
  employee: {
    name: string | null
    email: string
  } | null
}

export default function ClientPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'profile'>('dashboard')
  const [editMode, setEditMode] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    const supabase = createClient()
    
    // Obtener usuario actual
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      toast.error('No se pudo cargar la información del usuario')
      return
    }

    // Cargar datos del perfil
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, phone, created_at')
      .eq('id', authUser.id)
      .single()

    if (!userError && userData) {
      setUser(userData)
      setFormData({
        name: userData.name || '',
        phone: userData.phone || ''
      })
    }

    // Cargar citas
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        date,
        status,
        service_type,
        notes,
        employee:employee_id (
          name,
          email
        )
      `)
      .eq('client_id', authUser.id)
      .order('date', { ascending: false })

    if (!appointmentsError && appointmentsData) {
      setAppointments(appointmentsData)
    }

    setLoading(false)
  }

  const updateProfile = async () => {
    if (!user) return

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({
        name: formData.name,
        phone: formData.phone
      })
      .eq('id', user.id)

    if (!error) {
      toast.success('Perfil actualizado correctamente')
      setEditMode(false)
      loadUserData()
    } else {
      toast.error('Error al actualizar el perfil')
    }
  }

  const cancelAppointment = async (appointmentId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)

    if (!error) {
      toast.success('Cita cancelada correctamente')
      setCancellingId(null)
      loadUserData() // Recargar datos
    } else {
      toast.error('Error al cancelar la cita')
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    
    // Verificar si es hoy
    if (date.toDateString() === today.toDateString()) {
      return `Hoy a las ${timeStr}`
    }
    
    // Verificar si es mañana
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Mañana a las ${timeStr}`
    }
    
    // Fecha normal
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  const upcomingAppointments = appointments.filter(a => 
    new Date(a.date) >= new Date() && a.status !== 'cancelled' && a.status !== 'completed'
  )
  const pastAppointments = appointments.filter(a => 
    new Date(a.date) < new Date() || a.status === 'completed'
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: 'white'
              }}
            >
              {user?.name?.[0]?.toUpperCase() || user?.email[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                ¡Hola, {user?.name || user?.email}!
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Bienvenido a tu dashboard personal
              </p>
            </div>
          </div>
        </div>

        {/* Navegación por pestañas */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #f1f5f9' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '1rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'dashboard' ? '3px solid #667eea' : '3px solid transparent',
                color: activeTab === 'dashboard' ? '#667eea' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              🏠 Dashboard
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
              📅 Reservar Cita
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '1rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'profile' ? '3px solid #667eea' : '3px solid transparent',
                color: activeTab === 'profile' ? '#667eea' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              👤 Mi Perfil
            </button>
          </div>
        </div>

        {/* Contenido según pestaña activa */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total de Citas</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{appointments.length}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Próximas Citas</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{upcomingAppointments.length}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Completadas</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{appointments.filter(a => a.status === 'completed').length}</div>
              </div>
            </div>

            {/* Próximas citas */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
                  📅 Próximas Citas
                </h2>
                <button
                  onClick={() => setActiveTab('appointments')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  + Nueva Cita
                </button>
              </div>
              {upcomingAppointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                  <p style={{ color: '#64748b', marginBottom: '1rem' }}>No tienes citas próximas</p>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Reservar Cita
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {upcomingAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      style={{
                        padding: '1.5rem',
                        background: '#f8fafc',
                        borderRadius: '0.75rem',
                        border: '2px solid #e2e8f0',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Barra lateral de color según estado */}
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: getStatusColor(appointment.status)
                      }} />
                      
                      <div style={{ marginLeft: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
                              {appointment.service_type || 'Servicio no especificado'}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#667eea', fontWeight: '600', marginBottom: '0.25rem' }}>
                              � {formatDateTime(appointment.date)}
                            </div>
                            {appointment.employee && (
                              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                👤 Con: <strong>{appointment.employee.name || appointment.employee.email}</strong>
                              </div>
                            )}
                          </div>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            fontWeight: '600',
                            background: getStatusColor(appointment.status),
                            color: 'white',
                            whiteSpace: 'nowrap'
                          }}>
                            {getStatusText(appointment.status)}
                          </span>
                        </div>

                        {/* Botones de acción */}
                        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                            {cancellingId === appointment.id ? (
                              <>
                                <button
                                  onClick={() => cancelAppointment(appointment.id)}
                                  style={{
                                    flex: 1,
                                    padding: '0.625rem 1rem',
                                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  ✓ Confirmar Cancelación
                                </button>
                                <button
                                  onClick={() => setCancellingId(null)}
                                  style={{
                                    flex: 1,
                                    padding: '0.625rem 1rem',
                                    background: 'white',
                                    color: '#64748b',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  ✕ No, mantener
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setCancellingId(appointment.id)}
                                style={{
                                  padding: '0.625rem 1rem',
                                  background: 'white',
                                  color: '#ef4444',
                                  border: '2px solid #fee2e2',
                                  borderRadius: '0.5rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                🗑️ Cancelar Cita
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historial reciente */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
                📋 Historial Reciente
              </h2>
              {pastAppointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                  <p style={{ color: '#64748b' }}>Aún no tienes historial de citas</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pastAppointments.slice(0, 5).map((appointment) => (
                    <div
                      key={appointment.id}
                      style={{
                        padding: '1.25rem',
                        background: '#f8fafc',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}>
                            {appointment.service_type || 'Servicio no especificado'}
                          </div>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '9999px',
                            fontWeight: '600',
                            background: getStatusColor(appointment.status),
                            color: 'white'
                          }}>
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                          <span>� {new Date(appointment.date).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}</span>
                          {appointment.employee && (
                            <span>👤 {appointment.employee.name || appointment.employee.email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'white',
                  color: '#64748b',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                ← Volver
              </button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
                📅 Reservar Nueva Cita
              </h2>
            </div>
            <AppointmentSystem onAppointmentCreated={() => {
              loadUserData()
              toast.success('¡Cita creada! Volviendo al dashboard...')
              setTimeout(() => setActiveTab('dashboard'), 1500)
            }} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
                👤 Mi Perfil
              </h2>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  ✏️ Editar
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setEditMode(false)
                      setFormData({
                        name: user?.name || '',
                        phone: user?.phone || ''
                      })
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'white',
                      color: '#64748b',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={updateProfile}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    💾 Guardar
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>
                  Nombre Completo
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                ) : (
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '1rem', color: '#1e293b' }}>
                    {user?.name || 'No especificado'}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>
                  Email
                </label>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '1rem', color: '#64748b' }}>
                  {user?.email}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>El email no puede ser modificado</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>
                  Teléfono
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                ) : (
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '1rem', color: '#1e293b' }}>
                    {user?.phone || 'No especificado'}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>
                  Miembro desde
                </label>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '1rem', color: '#1e293b' }}>
                  {user && new Date(user.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
