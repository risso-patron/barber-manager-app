"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  User,
  DollarSign,
  CheckCircle,
  ArrowLeft,
  Scissors,
  Loader2
} from "lucide-react"

interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration: number
}

interface Employee {
  id: string
  name: string
  role?: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null

type BookingStep = "service" | "barber" | "datetime" | "confirm"

export default function BookAppointmentPage() {
  const router = useRouter()
  const user = useRequireAuth(["client"])
  
  const [step, setStep] = useState<BookingStep>("service")
  const [selectedService, setSelectedService] = useState<string>("")
  const [selectedBarber, setSelectedBarber] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [notes, setNotes] = useState("")
  const [services, setServices] = useState<Service[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      setSubmitError("Entorno sin Supabase configurado. Configura variables para reservar en modo real.")
      return
    }

    Promise.all([
      supabase
        .from("services")
        .select("id, name, description, price, duration")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("users")
        .select("id, name, role")
        .eq("role", "employee")
        .order("name")
    ]).then(([servicesRes, employeesRes]) => {
      if (servicesRes.data) setServices(servicesRes.data as Service[])
      if (employeesRes.data) setEmployees(employeesRes.data as Employee[])
      setIsLoading(false)
    })
  }, [])

  const handleSubmit = async () => {
    if (!user || !service || !barber || !supabase) return
    setIsSubmitting(true)
    setSubmitError(null)

    const res = await fetch("/api/bookings/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barbershop: "barber-manager",
        clientId: user.id,
        clientName: user.profile?.name || user.email,
        clientPhone: user.profile?.phone || "",
        clientEmail: user.email,
        serviceId: service.id,
        serviceName: service.name,
        employeeId: barber.id,
        employeeName: barber.name,
        date: selectedDate,
        time: selectedTime,
        duration: service.duration,
        price: service.price,
        notes: notes || undefined,
      }),
    })

    const result = await res.json()
    setIsSubmitting(false)

    if (!res.ok || !result.success) {
      setSubmitError(result.error || "Error al crear la cita. Intenta nuevamente.")
      return
    }

    router.push("/client/appointments")
  }

  const canContinue = () => {
    switch (step) {
      case "service": return selectedService !== ""
      case "barber": return selectedBarber !== ""
      case "datetime": return selectedDate !== "" && selectedTime !== ""
      case "confirm": return true
      default: return false
    }
  }

  const service = services.find(s => s.id === selectedService)
  const barber = employees.find(e => e.id === selectedBarber)

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ]

  if (!user) return null

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => {
            if (step === "service") {
              router.push("/client")
            } else {
              const steps: BookingStep[] = ["service", "barber", "datetime", "confirm"]
              const currentIndex = steps.indexOf(step)
              const prevStep = steps[currentIndex - 1]
              if (currentIndex > 0 && prevStep) {
                setStep(prevStep)
              }
            }
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Reservar Cita</h1>
            <p className="text-muted-foreground">
              {step === "service" && "Selecciona el servicio que deseas"}
              {step === "barber" && "Elige tu barbero preferido"}
              {step === "datetime" && "Selecciona fecha y hora"}
              {step === "confirm" && "Confirma los detalles de tu cita"}
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { id: "service", label: "Servicio" },
              { id: "barber", label: "Barbero" },
              { id: "datetime", label: "Fecha/Hora" },
              { id: "confirm", label: "Confirmar" }
            ].map((s, index) => {
              const steps: BookingStep[] = ["service", "barber", "datetime", "confirm"]
              const currentIndex = steps.indexOf(step)
              const stepIndex = steps.indexOf(s.id as BookingStep)
              const isActive = stepIndex === currentIndex
              const isCompleted = stepIndex < currentIndex
              
              return (
                <div key={s.id} className="flex-1 flex items-center">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold ${
                      isCompleted ? 'bg-green-600 text-white' :
                      isActive ? 'bg-blue-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : index + 1}
                    </div>
                    <span className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                      {s.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className={`h-1 flex-1 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step: Service Selection */}
        {step === "service" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Selecciona un Servicio</h2>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : services.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No hay servicios disponibles.</p>
            ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all ${
                    selectedService === service.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedService(service.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.duration} min
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                            <DollarSign className="h-3 w-3" />
                            ${service.price}
                          </Badge>
                        </div>
                      </div>
                      {selectedService === service.id && (
                        <CheckCircle className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </div>
        )}

        {/* Step: Barber Selection */}
        {step === "barber" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Elige tu Barbero</h2>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : employees.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No hay barberos disponibles. Pide al administrador que agregue empleados.</p>
            ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {employees.map((employee) => (
                <Card
                  key={employee.id}
                  className={`cursor-pointer transition-all ${
                    selectedBarber === employee.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedBarber(employee.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-lg">
                          {employee.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{employee.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{employee.role}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm font-medium">4.8</span>
                          </div>
                        </div>
                      </div>
                      {selectedBarber === employee.id && (
                        <CheckCircle className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </div>
        )}

        {/* Step: Date & Time Selection */}
        {step === "datetime" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Fecha y Hora</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="date">Selecciona una Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Hora Disponible</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="text-sm"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Confirmation */}
        {step === "confirm" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Confirma tu Cita</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Resumen de la Cita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Scissors className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Servicio</p>
                    <p className="text-sm text-muted-foreground">{service?.name}</p>
                    <div className="flex gap-3 mt-1 text-sm">
                      <span>{service?.duration} minutos</span>
                      <span className="text-green-600 font-medium">${service?.price}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Barbero</p>
                    <p className="text-sm text-muted-foreground">{barber?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Fecha y Hora</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate && new Date(selectedDate + "T12:00:00").toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })} a las {selectedTime}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                    rows={3}
                    placeholder="Ej: Prefiero un corte conservador..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {step !== "service" && (
            <Button
              variant="outline"
              onClick={() => {
                const steps: BookingStep[] = ["service", "barber", "datetime", "confirm"]
                const currentIndex = steps.indexOf(step)
                const prevStep = steps[currentIndex - 1]
                if (currentIndex > 0 && prevStep) {
                  setStep(prevStep)
                }
              }}
            >
              Anterior
            </Button>
          )}
          
          <Button
            onClick={() => {
              if (step === "confirm") {
                handleSubmit()
              } else {
                const steps: BookingStep[] = ["service", "barber", "datetime", "confirm"]
                const currentIndex = steps.indexOf(step)
                const nextStep = steps[currentIndex + 1]
                if (currentIndex < steps.length - 1 && nextStep) {
                  setStep(nextStep)
                }
              }
            }}
            disabled={!canContinue() || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</>
            ) : (
              step === "confirm" ? "Confirmar Reserva" : "Continuar"
            )}
          </Button>
        </div>
        {submitError && (
          <p className="text-sm text-red-600 text-center mt-3">{submitError}</p>
        )}
      </div>
    </div>
  )
}
