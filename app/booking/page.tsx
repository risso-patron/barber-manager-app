"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
}

interface Barber {
  id: string
  name: string
  email: string
}

export default function BookingPage() {
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1) // 1: servicio, 2: barbero y fecha, 3: datos personales

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedBarber && selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedBarber, selectedDate])

  const loadData = async () => {
    const supabase = createClient()

    try {
      // Cargar servicios activos
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (servicesError) throw servicesError

      // Cargar barberos (empleados activos)
      const { data: barbersData, error: barbersError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'employee')
        .order('name')

      if (barbersError) throw barbersError

      setServices(servicesData || [])
      setBarbers(barbersData || [])
    } catch (error: any) {
      toast.error('Error al cargar los datos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    const supabase = createClient()

    try {
      // Obtener citas existentes para ese barbero en esa fecha
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('barber_id', selectedBarber)
        .eq('appointment_date', selectedDate)
        .in('status', ['pending', 'confirmed'])

      if (error) throw error

      // Generar slots de 9:00 AM a 6:00 PM cada 30 minutos
      const allSlots: string[] = []
      for (let hour = 9; hour < 18; hour++) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:00`)
        allSlots.push(`${hour.toString().padStart(2, '0')}:30`)
      }

      // Filtrar slots ocupados
      const bookedTimes = appointments?.map(a => a.appointment_time.substring(0, 5)) || []
      const available = allSlots.filter(slot => !bookedTimes.includes(slot))

      setAvailableSlots(available)
    } catch (error: any) {
      toast.error('Error al cargar horarios disponibles')
      console.error(error)
    }
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Por favor completa todos los campos')
      return
    }

    if (!clientData.name || !clientData.email || !clientData.phone) {
      toast.error('Por favor completa tus datos personales')
      return
    }

    const supabase = createClient()

    try {
      // Verificar si el cliente ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', clientData.email)
        .single()

      let clientId = existingUser?.id

      // Si no existe, crear el usuario
      if (!clientId) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: clientData.email,
          password: Math.random().toString(36).slice(-8), // Password temporal
          options: {
            data: {
              name: clientData.name,
              role: 'client'
            }
          }
        })

        if (authError) throw authError

        if (authData.user) {
          const { error: dbError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              name: clientData.name,
              email: clientData.email,
              phone: clientData.phone,
              role: 'client'
            })

          if (dbError) throw dbError
          clientId = authData.user.id
        }
      }

      // Crear la cita
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          client_id: clientId,
          barber_id: selectedBarber,
          service_id: selectedService.id,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          status: 'pending',
          notes: clientData.notes
        })

      if (appointmentError) throw appointmentError

      toast.success('¡Reserva creada exitosamente! Recibirás un correo de confirmación.')
      
      // Reset form
      setStep(1)
      setSelectedService(null)
      setSelectedBarber("")
      setSelectedDate("")
      setSelectedTime("")
      setClientData({ name: "", email: "", phone: "", notes: "" })
      setAvailableSlots([])
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la reserva')
      console.error(error)
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30) // 30 días adelante
    return maxDate.toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid rgba(255,255,255,0.3)', 
            borderTop: '4px solid white', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite', 
            margin: '0 auto 1rem' 
          }}></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', color: 'white' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            ✂️ Barbería Premium
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>
            Reserva tu cita en línea
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {[1, 2, 3].map((num) => (
            <div key={num} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: step >= num ? 'white' : 'rgba(255,255,255,0.3)',
                color: step >= num ? '#667eea' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}>
                {num}
              </div>
              <span style={{ 
                color: 'white', 
                fontWeight: step >= num ? '600' : '400',
                display: window.innerWidth > 640 ? 'inline' : 'none'
              }}>
                {num === 1 ? 'Servicio' : num === 2 ? 'Fecha y Hora' : 'Datos'}
              </span>
              {num < 3 && <span style={{ color: 'white', margin: '0 0.5rem' }}>→</span>}
            </div>
          ))}
        </div>

        {/* Step 1: Seleccionar Servicio */}
        {step === 1 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1e293b' }}>
              Selecciona un servicio
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  style={{
                    padding: '1.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                        {service.name}
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                        {service.description}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                        <span style={{ color: '#667eea', fontWeight: '600' }}>
                          ⏱️ {service.duration} min
                        </span>
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: '#667eea',
                      marginLeft: '1rem'
                    }}>
                      ${service.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Seleccionar Barbero, Fecha y Hora */}
        {step === 2 && selectedService && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  color: '#667eea',
                  fontWeight: '500',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                ← Cambiar servicio
              </button>
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                Servicio seleccionado:
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}>
                {selectedService.name} - ${selectedService.price}
              </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1e293b' }}>
              Selecciona barbero, fecha y hora
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Barbero *
              </label>
              <select
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="">Selecciona un barbero</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Fecha *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {availableSlots.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Hora disponible *
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      style={{
                        padding: '0.75rem',
                        border: `2px solid ${selectedTime === slot ? '#667eea' : '#e2e8f0'}`,
                        borderRadius: '0.5rem',
                        background: selectedTime === slot ? '#667eea' : 'white',
                        color: selectedTime === slot ? 'white' : '#1e293b',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedTime !== slot) {
                          e.currentTarget.style.borderColor = '#667eea'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTime !== slot) {
                          e.currentTarget.style.borderColor = '#e2e8f0'
                        }
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedBarber && selectedDate && availableSlots.length === 0 && (
              <div style={{
                padding: '1rem',
                background: '#fef3c7',
                borderRadius: '0.5rem',
                color: '#92400e',
                marginBottom: '1.5rem'
              }}>
                No hay horarios disponibles para esta fecha. Por favor selecciona otra fecha.
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              disabled={!selectedBarber || !selectedDate || !selectedTime}
              style={{
                width: '100%',
                padding: '1rem',
                background: selectedBarber && selectedDate && selectedTime ? '#667eea' : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: selectedBarber && selectedDate && selectedTime ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedBarber && selectedDate && selectedTime) {
                  e.currentTarget.style.background = '#5568d3'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedBarber && selectedDate && selectedTime) {
                  e.currentTarget.style.background = '#667eea'
                }
              }}
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Step 3: Datos Personales */}
        {step === 3 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  color: '#667eea',
                  fontWeight: '500',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                ← Cambiar fecha/hora
              </button>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1e293b' }}>
              Ingresa tus datos
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={clientData.name}
                  onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                  required
                  placeholder="Juan Pérez"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  required
                  placeholder="juan@ejemplo.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={clientData.phone}
                  onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                  required
                  placeholder="+52 123 456 7890"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Notas (opcional)
                </label>
                <textarea
                  value={clientData.notes}
                  onChange={(e) => setClientData({ ...clientData, notes: e.target.value })}
                  placeholder="¿Alguna preferencia o comentario?"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#5568d3'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#667eea'}
              >
                Confirmar Reserva
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'white', opacity: 0.8 }}>
          <p style={{ fontSize: '0.875rem' }}>
            © 2024 Barbería Premium. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
