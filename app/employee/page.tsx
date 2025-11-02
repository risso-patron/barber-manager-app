"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { WorkSessionTracker } from "@/components/employee/work-session-tracker"
import toast from 'react-hot-toast'

interface Appointment {
  id: string
  client_name: string
  service_name: string
  appointment_date: string
  appointment_time: string
  status: string
  notes?: string
}

interface DayStats {
  total: number
  completed: number
  pending: number
  cancelled: number
}

export default function EmployeePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [todayStats, setTodayStats] = useState<DayStats>({ total: 0, completed: 0, pending: 0, cancelled: 0 })
  const [loading, setLoading] = useState(true)
  const [employeeId, setEmployeeId] = useState<string | null>(null)

  useEffect(() => {
    loadEmployeeData()
  }, [])

  const loadEmployeeData = async () => {
    const supabase = createClient()
    
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Debes iniciar sesión')
      return
    }

    // Buscar empleado por email
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!employee) {
      toast.error('No se encontró el empleado')
      return
    }

    setEmployeeId(employee.id)
    
    // Cargar citas del día
    const today = new Date().toISOString().split('T')[0]
    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        clients:client_id (name),
        services:service_id (name)
      `)
      .eq('barber_id', employee.id)
      .gte('appointment_date', today)
      .order('appointment_time', { ascending: true })

    if (appointmentsData) {
      const formatted = appointmentsData.map((apt: any) => ({
        id: apt.id,
        client_name: apt.clients?.name || 'Cliente',
        service_name: apt.services?.name || 'Servicio',
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        status: apt.status,
        notes: apt.notes
      }))
      
      setAppointments(formatted)
      
      // Calcular estadísticas del día
      const todayAppts = formatted.filter(a => a.appointment_date === today)
      setTodayStats({
        total: todayAppts.length,
        completed: todayAppts.filter(a => a.status === 'completed').length,
        pending: todayAppts.filter(a => a.status === 'pending').length,
        cancelled: todayAppts.filter(a => a.status === 'cancelled').length
      })
    }
    
    setLoading(false)
  }

  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      toast.success('Estado actualizado')
      loadEmployeeData()
    } else {
      toast.error('Error al actualizar')
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(a => a.appointment_date === today)
  const upcomingAppointments = appointments.filter(a => a.appointment_date > today)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
          💼 Mi Área de Trabajo
        </h1>
        <p style={{ color: '#64748b' }}>
          Gestiona tu agenda diaria y mantén el control de tus horarios
        </p>
      </div>

      {/* Estadísticas del Día */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Hoy</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{todayStats.total}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Completadas</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{todayStats.completed}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Pendientes</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{todayStats.pending}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Canceladas</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{todayStats.cancelled}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Citas de Hoy */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
            📅 Citas de Hoy
          </h2>
          {todayAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
              <p>No tienes citas para hoy</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: apt.status === 'completed' ? '#f0fdf4' : apt.status === 'cancelled' ? '#fef2f2' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                        🕐 {apt.appointment_time}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        👤 {apt.client_name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        ✂️ {apt.service_name}
                      </div>
                    </div>
                    <select
                      value={apt.status}
                      onChange={(e) => updateAppointmentStatus(apt.id, e.target.value)}
                      style={{
                        padding: '0.375rem 0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        background: apt.status === 'completed' ? '#dcfce7' : apt.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                        color: apt.status === 'completed' ? '#166534' : apt.status === 'cancelled' ? '#991b1b' : '#854d0e'
                      }}
                    >
                      <option value="pending">⏳ Pendiente</option>
                      <option value="confirmed">✅ Confirmada</option>
                      <option value="completed">✔️ Completada</option>
                      <option value="cancelled">❌ Cancelada</option>
                    </select>
                  </div>
                  {apt.notes && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.25rem' }}>
                      💬 {apt.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximas Citas */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
            📆 Próximas Citas
          </h2>
          {upcomingAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📅</div>
              <p>No tienes citas próximas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
              {upcomingAppointments.slice(0, 10).map((apt) => (
                <div
                  key={apt.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem'
                  }}
                >
                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                    📅 {new Date(apt.appointment_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - {apt.appointment_time}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    👤 {apt.client_name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    ✂️ {apt.service_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sesión de Trabajo */}
        <div style={{ gridColumn: 'span 2' }}>
          <WorkSessionTracker />
        </div>
      </div>
    </div>
  )
}
