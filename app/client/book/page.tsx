"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  Loader2,
} from "lucide-react"
import { DEMO_SERVICES, DEMO_EMPLOYEES } from "@/lib/demo-appointments"

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

const DEMO_MODE_SERVICES: Service[] = DEMO_SERVICES.map(s => ({
  id: s.id, name: s.name, description: s.description, price: s.price, duration: s.duration,
}))

const DEMO_MODE_EMPLOYEES: Employee[] = DEMO_EMPLOYEES.map(e => ({
  id: e.id, name: e.name, role: e.role,
}))

export default function BookAppointmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rescheduleId = searchParams.get("reschedule")
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
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isReschedule, setIsReschedule] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setServices(DEMO_MODE_SERVICES)
      setEmployees(DEMO_MODE_EMPLOYEES)
      setIsDemoMode(true)
      setIsLoading(false)

      // Si es reagendar, prellenar con los datos de la cita
      if (rescheduleId) {
        // Buscar en localStorage citas guardadas en sesión + DEMO_APPOINTMENTS
        const { DEMO_APPOINTMENTS } = require("@/lib/demo-appointments")
        const apt = DEMO_APPOINTMENTS.find((a: { id: string }) => a.id === rescheduleId)
        if (apt) {
          setSelectedService(apt.serviceId)
          setSelectedBarber(apt.employeeId)
          setIsReschedule(true)
        }
      }
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
        .order("name"),
    ]).then(([servicesRes, employeesRes]) => {
      const svcData = servicesRes.data as Service[] | null
      const empData = employeesRes.data as Employee[] | null
      setServices(svcData && svcData.length > 0 ? svcData : DEMO_MODE_SERVICES)
      setEmployees(empData && empData.length > 0 ? empData : DEMO_MODE_EMPLOYEES)
      setIsLoading(false)

      if (rescheduleId) {
        // Intentar leer la cita desde Supabase
        supabase
          .from("appointments")
          .select("service_id, barber_id")
          .eq("id", rescheduleId)
          .single()
          .then(({ data }) => {
            if (data) {
              setSelectedService(data.service_id || "")
              setSelectedBarber(data.barber_id || "")
              setIsReschedule(true)
            }
          })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rescheduleId])

  const handleSubmit = async () => {
    if (!user || !service || !barber) return
    setIsSubmitting(true)
    setSubmitError(null)

    // Demo mode: simular reserva
    if (!supabase) {
      await new Promise(res => setTimeout(res, 600))
      setIsSubmitting(false)
      const msg = isReschedule ? "Cita reagendada en modo demo." : "Cita reservada en modo demo."
      router.push(`/client/appointments?success=${encodeURIComponent(msg)}`)
      return
    }

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
        rescheduleId: rescheduleId || undefined,
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
      case "service":  return selectedService !== ""
      case "barber":   return selectedBarber !== ""
      case "datetime": return selectedDate !== "" && selectedTime !== ""
      case "confirm":  return true
      default:         return false
    }
  }

  const stepHint = () => {
    switch (step) {
      case "service":  return selectedService === "" ? "Selecciona un servicio para continuar." : ""
      case "barber":   return selectedBarber === "" ? "Selecciona un barbero para continuar." : ""
      case "datetime": return !selectedDate ? "Selecciona una fecha para continuar." : !selectedTime ? "Selecciona una hora para continuar." : ""
      default:         return ""
    }
  }

  const service = services.find(s => s.id === selectedService)
  const barber = employees.find(e => e.id === selectedBarber)
  const todayISO = new Date().toISOString().slice(0, 10)

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  ]

  if (!user) return null

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              if (step === "service") {
                router.push("/client")
              } else {
                const steps: BookingStep[] = ["service", "barber", "datetime", "confirm"]
                const idx = steps.indexOf(step)
                const prev = steps[idx - 1]
                if (idx > 0 && prev) setStep(prev)
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {isReschedule ? "Reagendar Cita" : "Reservar Cita"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {step === "service"  && "Selecciona el servicio que deseas"}
              {step === "barber"   && "Elige tu barbero preferido"}
              {step === "datetime" && "Selecciona fecha y hora"}
              {step === "confirm"  && "Confirma los detalles de tu cita"}
            </p>
          </div>
        </div>

        {/* Demo banner */}
        {isDemoMode && (
          <div className="mb-6 px-4 py-3 rounded-md text-sm" style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", color: "#8A8A8A" }}>
            Reservas en modo demo. Puedes probar el flujo con servicios de ejemplo.
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(["service", "barber", "datetime", "confirm"] as BookingStep[]).map((s, index) => {
              const stepLabels: Record<BookingStep, string> = {
                service: "Servicio", barber: "Barbero", datetime: "Fecha/Hora", confirm: "Confirmar",
              }
              const steps: BookingStep[] = ["service", "barber", "datetime", "confirm"]
              const currentIndex = steps.indexOf(step)
              const stepIndex = steps.indexOf(s)
              const isActive = stepIndex === currentIndex
              const isCompleted = stepIndex < currentIndex

              return (
                <div key={s} className="flex-1 flex items-center">
                  <div className="flex items-center gap-1 md:gap-2 flex-1">
                    <div className={`h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      isCompleted ? "bg-green-600 text-white" : isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}>
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className={`text-xs md:text-sm font-medium hidden sm:inline ${isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-600"}`}>
                      {stepLabels[s]}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className={`h-1 flex-1 mx-1 md:mx-2 ${isCompleted ? "bg-green-600" : "bg-gray-200"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step: Service */}
        {step === "service" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Selecciona un Servicio</h2>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {services.map((svc) => (
                  <Card
                    key={svc.id}
                    className={`cursor-pointer transition-all ${
                      selectedService === svc.id ? "border-blue-600 bg-blue-50" : "hover:border-gray-400"
                    }`}
                    onClick={() => setSelectedService(svc.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{svc.name}</h3>
                          {svc.description && (
                            <p className="text-sm text-muted-foreground mb-3">{svc.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {svc.duration} min
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                              <DollarSign className="h-3 w-3" />
                              ${svc.price}
                            </Badge>
                          </div>
                        </div>
                        {selectedService === svc.id && (
                          <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Barber */}
        {step === "barber" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Elige tu Barbero</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {employees.map((emp) => (
                <Card
                  key={emp.id}
                  className={`cursor-pointer transition-all ${
                    selectedBarber === emp.id ? "border-blue-600 bg-blue-50" : "hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedBarber(emp.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{emp.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{emp.role}</p>
                        </div>
                      </div>
                      {selectedBarber === emp.id && (
                        <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step: Date & Time */}
        {step === "datetime" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Fecha y Hora</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="date">Selecciona una Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={todayISO}
                  className="mt-2"
                />
                {selectedDate && new Date(selectedDate) < new Date(todayISO) && (
                  <p className="text-xs text-red-600 mt-1">La fecha no puede ser anterior a hoy.</p>
                )}
              </div>
              <div>
                <Label>Hora Disponible</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                      className="text-sm"
                      style={{ minHeight: 44 }}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              {isReschedule ? "Confirma el Reagendamiento" : "Confirma tu Cita"}
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Resumen de la Cita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Scissors className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Servicio</p>
                    <p className="text-sm text-muted-foreground">{service?.name}</p>
                    <div className="flex gap-3 mt-1 text-sm flex-wrap">
                      <span>{service?.duration} minutos</span>
                      <span className="text-green-600 font-medium">${service?.price}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Barbero</p>
                    <p className="text-sm text-muted-foreground">{barber?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Fecha y Hora</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate && new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric",
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

        {/* Navigation */}
        <div className="flex flex-col gap-2 mt-8">
          <div className="flex gap-3">
            {step !== "service" && (
              <Button
                type="button"
                variant="outline"
                style={{ minHeight: 44 }}
                onClick={() => {
                  const steps: BookingStep[] = ["service", "barber", "datetime", "confirm"]
                  const idx = steps.indexOf(step)
                  const prev = steps[idx - 1]
                  if (idx > 0 && prev) setStep(prev)
                }}
              >
                Anterior
              </Button>
            )}
            <Button
              type="button"
              onClick={() => {
                if (step === "confirm") {
                  handleSubmit()
                } else {
                  const steps: BookingStep[] = ["service", "barber", "datetime", "confirm"]
                  const idx = steps.indexOf(step)
                  const next = steps[idx + 1]
                  if (idx < steps.length - 1 && next) setStep(next)
                }
              }}
              disabled={!canContinue() || isSubmitting}
              className="flex-1"
              style={{ minHeight: 44 }}
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</>
              ) : (
                step === "confirm"
                  ? (isReschedule ? "Confirmar Reagendamiento" : "Confirmar Reserva")
                  : "Continuar"
              )}
            </Button>
          </div>
          {!canContinue() && stepHint() && (
            <p className="text-xs text-muted-foreground text-center">{stepHint()}</p>
          )}
          {submitError && (
            <p className="text-sm text-red-600 text-center">{submitError}</p>
          )}
        </div>

      </div>
    </div>
  )
}
