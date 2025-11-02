"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Calendar, dateFnsLocalizer, Event, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar.css'

// Configurar localización en español
const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales,
})

interface Appointment {
  id: string
  client_id: string
  barber_id: string
  service_id: string
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  client_name?: string
  client_email?: string
  barber_name?: string
  service_name?: string
  service_price?: number
  service_duration?: number
}

interface CalendarEvent extends Event {
  id: string
  resource: Appointment
}

export function CalendarView() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients:client_id (name, email),
        barbers:barber_id (name),
        services:service_id (name, price, duration)
      `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    if (!error && data) {
      const transformedData = data.map((apt: any) => ({
        ...apt,
        client_name: apt.clients?.name || 'Sin nombre',
        client_email: apt.clients?.email || '',
        barber_name: apt.barbers?.name || 'Sin asignar',
        service_name: apt.services?.name || 'Sin servicio',
        service_price: apt.services?.price || 0,
        service_duration: apt.services?.duration || 30,
      }))
      setAppointments(transformedData)
    } else {
      toast.error('Error al cargar las citas')
    }
    
    setLoading(false)
  }

  // Convertir citas a eventos del calendario
  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map((apt) => {
      const [hours, minutes] = apt.appointment_time.split(':')
      const startDate = new Date(apt.appointment_date)
      startDate.setHours(parseInt(hours), parseInt(minutes), 0)
      
      const endDate = new Date(startDate)
      endDate.setMinutes(endDate.getMinutes() + (apt.service_duration || 30))

      return {
        id: apt.id,
        title: `${apt.client_name} - ${apt.service_name}`,
        start: startDate,
        end: endDate,
        resource: apt,
      }
    })
  }, [appointments])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event.resource)
    setShowEventModal(true)
  }, [])

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate)
  }, [])

  const handleViewChange = useCallback((newView: View) => {
    setView(newView)
  }, [])

  const updateAppointmentStatus = async (id: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      toast.success('Estado actualizado correctamente')
      loadAppointments()
      setShowEventModal(false)
    } else {
      toast.error('Error al actualizar el estado')
    }
  }

  // Estilo de eventos basado en estado
  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status
    let backgroundColor = '#3b82f6'
    
    switch (status) {
      case 'pending':
        backgroundColor = '#f59e0b'
        break
      case 'confirmed':
        backgroundColor = '#3b82f6'
        break
      case 'completed':
        backgroundColor = '#10b981'
        break
      case 'cancelled':
        backgroundColor = '#ef4444'
        break
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Cargando calendario...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', height: 'calc(100vh - 12rem)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
          📅 Calendario de Citas
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#f59e0b' }}></div>
              <span>Pendiente</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#3b82f6' }}></div>
              <span>Confirmada</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#10b981' }}></div>
              <span>Completada</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#ef4444' }}></div>
              <span>Cancelada</span>
            </div>
          </div>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100% - 80px)' }}
        onSelectEvent={handleSelectEvent}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        view={view}
        date={date}
        eventPropGetter={eventStyleGetter}
        messages={{
          next: "Siguiente",
          previous: "Anterior",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          agenda: "Agenda",
          date: "Fecha",
          time: "Hora",
          event: "Cita",
          noEventsInRange: "No hay citas en este rango",
          showMore: (total) => `+ Ver más (${total})`,
        }}
        culture="es"
      />

      {/* Modal de detalles del evento */}
      {showEventModal && selectedEvent && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowEventModal(false)}
        >
          <div 
            style={{ 
              background: 'white', 
              borderRadius: '1rem', 
              padding: '2rem', 
              maxWidth: '500px', 
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                Detalles de la Cita
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Cliente</p>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>{selectedEvent.client_name}</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{selectedEvent.client_email}</p>
              </div>

              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Barbero</p>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>{selectedEvent.barber_name}</p>
              </div>

              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Servicio</p>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>{selectedEvent.service_name}</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  ${selectedEvent.service_price} • {selectedEvent.service_duration} min
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Fecha y Hora</p>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                  {new Date(selectedEvent.appointment_date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{selectedEvent.appointment_time}</p>
              </div>

              {selectedEvent.notes && (
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Notas</p>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{selectedEvent.notes}</p>
                </div>
              )}

              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Estado</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => {
                    const statusLabels = {
                      pending: 'Pendiente',
                      confirmed: 'Confirmada',
                      completed: 'Completada',
                      cancelled: 'Cancelada',
                    }
                    const statusColors = {
                      pending: '#f59e0b',
                      confirmed: '#3b82f6',
                      completed: '#10b981',
                      cancelled: '#ef4444',
                    }
                    
                    return (
                      <button
                        key={status}
                        onClick={() => updateAppointmentStatus(selectedEvent.id, status)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: selectedEvent.status === status ? `2px solid ${statusColors[status]}` : '2px solid #e2e8f0',
                          background: selectedEvent.status === status ? statusColors[status] : 'white',
                          color: selectedEvent.status === status ? 'white' : '#64748b',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                        }}
                      >
                        {statusLabels[status]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEventModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
