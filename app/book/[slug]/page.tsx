"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { type Service } from "@/lib/demo"

/** Shape of employee rows returned by the Supabase query in this page. */
type Employee = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  avatar_url?: string
}
import { createBrowserClient } from "@supabase/ssr"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Scissors, 
  CheckCircle,
  ArrowRight,
  MapPin,
  Star
} from "lucide-react"

interface BookingForm {
  clientName: string
  clientEmail: string
  clientPhone: string
  serviceId: string
  employeeId: string
  date: string
  time: string
  notes: string
}

export default function PublicBookingPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [step, setStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [bookingSuccess, setBookingSuccess] = useState(false)
  
  const [formData, setFormData] = useState<BookingForm>({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    serviceId: "",
    employeeId: "",
    date: "",
    time: "",
    notes: ""
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Simulated barbershop data based on slug
  const barbershop = {
    name: slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    address: "Av. Principal 123, Ciudad",
    phone: "+1 (555) 123-4567",
    rating: 4.8,
    reviews: 234
  }

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.from("services").select("*").eq("is_active", true).order("name").then(({ data }) => {
      if (data) setServices(data)
    })
    supabase.from("users").select("id, name, email, phone, role, avatar_url").in("role", ["employee", "admin"]).not("role", "eq", "client").order("name").then(({ data }) => {
      if (data) setEmployees(data.map(u => ({ ...u, avatar: u.avatar_url })))
    })
  }, [])

  const availableTimes = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00"
  ]

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setFormData({ ...formData, serviceId: service.id })
    setStep(2)
  }

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData({ ...formData, employeeId: employee.id })
    setStep(3)
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setFormData({ ...formData, date })
    setStep(4)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setFormData({ ...formData, time })
    setStep(5)
  }

  const validateContactInfo = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.clientName.trim()) {
      newErrors.clientName = "El nombre es requerido"
    }

    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = "El teléfono es requerido"
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.clientPhone)) {
      newErrors.clientPhone = "Teléfono inválido"
    }

    if (formData.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = "Email inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateContactInfo()) {
      return
    }

    // Create booking via API
    const bookingData = {
      barbershop: slug,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      serviceId: formData.serviceId,
      serviceName: selectedService?.name,
      employeeId: formData.employeeId,
      employeeName: selectedEmployee?.name,
      date: formData.date,
      time: formData.time,
      duration: selectedService?.duration,
      price: selectedService?.price,
      notes: formData.notes
    }

    try {
      const response = await fetch('/api/bookings/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })

      if (!response.ok) {
        throw new Error('Error creando la reserva')
      }

      const result = await response.json()
      void result // consumed by API

      // Notificaciones se envían automáticamente desde la API
      setBookingSuccess(true)

    } catch (error) {
      console.error("Error:", error)
      alert("Hubo un error al procesar tu reserva. Por favor intenta de nuevo.")
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    return maxDate.toISOString().split('T')[0]
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">¡Reserva Confirmada!</h2>
              <p className="text-gray-600 mb-6">
                Tu cita ha sido agendada exitosamente
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
                <h3 className="font-semibold mb-4">Detalles de tu Cita:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Scissors className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Servicio</p>
                      <p className="font-medium">{selectedService?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Barbero</p>
                      <p className="font-medium">{selectedEmployee?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha y Hora</p>
                      <p className="font-medium">
                        {new Date(selectedDate).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} - {selectedTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  📱 Recibirás una confirmación por WhatsApp y/o Email con todos los detalles
                </p>
              </div>

              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Hacer otra reserva
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{barbershop.name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {barbershop.address}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {barbershop.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {barbershop.rating} ({barbershop.reviews} reseñas)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {s}
                </div>
                {s < 5 && (
                  <div className={`w-16 h-1 mx-2 ${s < step ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Selecciona un Servicio</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <Card 
                  key={service.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-blue-600" />
                        {service.name}
                      </span>
                      <Badge className="bg-green-100 text-green-800">
                        ${service.price}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        {service.duration} min
                      </span>
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Barber */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Selecciona tu Barbero</h2>
            <p className="text-gray-600 mb-6">
              Servicio seleccionado: <span className="font-semibold">{selectedService?.name}</span>
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {employees.map((employee) => (
                <Card 
                  key={employee.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                  onClick={() => handleEmployeeSelect(employee)}
                >
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <User className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{employee.name}</h3>
                      <Badge variant="outline" className="mb-4 capitalize">
                        {employee.role}
                      </Badge>
                      <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-4 w-4 fill-yellow-500" />
                        ))}
                      </div>
                      <ArrowRight className="h-5 w-5 text-blue-600 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Date */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Selecciona la Fecha</h2>
            <p className="text-gray-600 mb-6">
              Con: <span className="font-semibold">{selectedEmployee?.name}</span>
            </p>
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <Label htmlFor="date">Fecha de la Cita</Label>
                <Input
                  id="date"
                  type="date"
                  min={getMinDate()}
                  max={getMaxDate()}
                  value={selectedDate}
                  onChange={(e) => handleDateSelect(e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Puedes reservar hasta 30 días adelante
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Select Time */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Selecciona la Hora</h2>
            <p className="text-gray-600 mb-6">
              {new Date(selectedDate).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <div className="grid gap-3 md:grid-cols-4 max-w-2xl mx-auto">
              {availableTimes.map((time) => (
                <Button
                  key={time}
                  variant="outline"
                  className="h-14 text-lg hover:bg-blue-600 hover:text-white"
                  onClick={() => handleTimeSelect(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Contact Information */}
        {step === 5 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Confirma tus Datos</h2>
            <div className="max-w-lg mx-auto">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Resumen de tu Reserva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servicio:</span>
                    <span className="font-semibold">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Barbero:</span>
                    <span className="font-semibold">{selectedEmployee?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-semibold">
                      {new Date(selectedDate).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hora:</span>
                    <span className="font-semibold">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600">Duración:</span>
                    <span className="font-semibold">{selectedService?.duration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio:</span>
                    <span className="font-semibold text-green-600">${selectedService?.price}</span>
                  </div>
                </CardContent>
              </Card>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Nombre Completo *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Tu nombre completo"
                    className={errors.clientName ? "border-red-500" : ""}
                  />
                  {errors.clientName && (
                    <p className="text-red-500 text-sm mt-1">{errors.clientName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="clientPhone">Teléfono *</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className={errors.clientPhone ? "border-red-500" : ""}
                  />
                  {errors.clientPhone && (
                    <p className="text-red-500 text-sm mt-1">{errors.clientPhone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="clientEmail">Email (opcional)</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="tu@email.com"
                    className={errors.clientEmail ? "border-red-500" : ""}
                  />
                  {errors.clientEmail && (
                    <p className="text-red-500 text-sm mt-1">{errors.clientEmail}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Notas Adicionales (opcional)</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Alguna preferencia o comentario..."
                    className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(4)}
                    className="flex-1"
                  >
                    Atrás
                  </Button>
                  <Button type="submit" className="flex-1">
                    Confirmar Reserva
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  )
}
