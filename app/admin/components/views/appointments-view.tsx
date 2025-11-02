"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast'

interface Appointment {
  id: string
  client_name: string
  employee_name: string
  service: string
  appointment_date: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
}

export function AppointmentsView() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: false })
      .limit(50)

    if (!error && data) {
      setAppointments(data)
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      toast.success('Estado actualizado correctamente')
      
      // Enviar email de notificación solo para estados confirmados, cancelados o completados
      if (['confirmed', 'cancelled', 'completed'].includes(newStatus)) {
        try {
          const appointment = appointments.find(apt => apt.id === id)
          if (appointment && appointment.client_email) {
            const { sendAppointmentStatusUpdate } = await import('@/lib/email')
            await sendAppointmentStatusUpdate({
              clientName: appointment.client_name || 'Cliente',
              clientEmail: appointment.client_email,
              service: appointment.service || 'Servicio',
              barberName: appointment.employee_name || 'Barbero',
              date: new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              time: appointment.appointment_time,
              status: newStatus as 'confirmed' | 'cancelled' | 'completed'
            })
          }
        } catch (emailError) {
          console.error('Error sending status email:', emailError)
        }
      }
      
      loadAppointments()
    } else {
      toast.error('Error al actualizar el estado')
    }
  }

  const deleteAppointment = async (id: string) => {
    const confirmDelete = window.confirm('¿Estás seguro de eliminar esta cita?')
    if (!confirmDelete) return

    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (!error) {
      toast.success('Cita eliminada correctamente')
      loadAppointments()
    } else {
      toast.error('Error al eliminar la cita')
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    const matchesFilter = filter === 'all' || apt.status === filter
    const matchesSearch = (apt.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (apt.employee_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (apt.service?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const STATUS_COLORS = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    completed: '#10b981',
    cancelled: '#ef4444'
  }

  const STATUS_LABELS = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada'
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
          📅 Gestión de Citas
        </h2>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por cliente, empleado o servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: '1',
              minWidth: '250px',
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">📋 Todas</option>
            <option value="pending">⏳ Pendientes</option>
            <option value="confirmed">✅ Confirmadas</option>
            <option value="completed">✔️ Completadas</option>
            <option value="cancelled">❌ Canceladas</option>
          </select>
        </div>

        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Mostrando {filteredAppointments.length} de {appointments.length} citas
        </div>
      </div>

      {/* Tabla de Citas */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        {filteredAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p>No se encontraron citas</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Fecha</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Cliente</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Empleado</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Servicio</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Estado</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((apt) => (
                <tr key={apt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>
                    {new Date(apt.appointment_date).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '500', color: '#1e293b' }}>
                    {apt.client_name}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>
                    {apt.employee_name}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>
                    {apt.service}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select
                      value={apt.status}
                      onChange={(e) => updateStatus(apt.id, e.target.value)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: STATUS_COLORS[apt.status],
                        color: 'white'
                      }}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => deleteAppointment(apt.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
