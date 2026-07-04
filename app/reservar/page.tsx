"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { DEMO_SERVICES, DEMO_EMPLOYEES } from "@/lib/demo-appointments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { SignupPromptModal } from "@/components/booking/signup-prompt-modal"
import { 
  Calendar, 
  Clock, 
  Scissors, 
  User,
  Phone,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2
} from "lucide-react"

type Step = "service" | "barber" | "datetime" | "contact" | "confirmation"

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
  specialty?: string
  avg_rating?: number | null
  total_ratings?: number | null
}

interface BookingData {
  services: Service[]
  barber?: Employee
  date?: string
  time?: string
  name?: string
  phone?: string
  email?: string
}

function addTime(base: string, minutes: number): string {
  const [h, m] = base.split(":").map(Number)
  const total = h! * 60 + m! + minutes
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null

export default function ReservarPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("service")
  const [booking, setBooking] = useState<BookingData>({ services: [] })
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState({ services: true, employees: true })
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    // Generar fechas en el cliente para evitar hidratación mismatch
    const dates = Array.from({ length: 14 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() + i)
      return date.toISOString().slice(0, 10)
    })
    setAvailableDates(dates)

    if (!supabase) {
      setServices(DEMO_SERVICES.map(s => ({ id: s.id, name: s.name, description: s.description, price: s.price, duration: s.duration })))
      setEmployees(DEMO_EMPLOYEES.map(e => ({ id: e.id, name: e.name })))
      setIsLoading({ services: false, employees: false })
      return
    }

    const fetchInitialData = async () => {
      try {
        const { data: servicesData } = await supabase
          .from("services")
          .select("id, name, description, price, duration")
          .eq("is_active", true)
          .order("name")
        
        if (servicesData) setServices(servicesData as Service[])
        setIsLoading(prev => ({ ...prev, services: false }))

        const { data: employeesData } = await supabase
          .from("users")
          .select("id, name, specialty")
          .eq("role", "employee")
          .order("name")
        
        if (employeesData) {
          // Fetch avg ratings from the view
          const { data: ratingsData } = await supabase
            .from("barber_avg_ratings")
            .select("barber_id, avg_rating, total_ratings")

          const ratingsMap = new Map(
            (ratingsData ?? []).map((r: { barber_id: string; avg_rating: number | null; total_ratings: number | null }) => [
              r.barber_id,
              { avg_rating: r.avg_rating, total_ratings: r.total_ratings },
            ])
          )

          setEmployees(
            (employeesData as Employee[]).map((e) => ({
              ...e,
              avg_rating: ratingsMap.get(e.id)?.avg_rating ?? null,
              total_ratings: ratingsMap.get(e.id)?.total_ratings ?? null,
            }))
          )
        }
        setIsLoading(prev => ({ ...prev, employees: false }))
      } catch (error) {
        console.error("Error fetching data:", error)
        setIsLoading({ services: false, employees: false })
      }
    }

    fetchInitialData()
  }, [])

  const totalDuration = booking.services.reduce((s, x) => s + x.duration, 0)

  useEffect(() => {
    if (!booking.date || !booking.barber?.id) {
      setAvailableSlots([])
      return
    }
    setSlotsLoading(true)
    fetch(`/api/availability?barber_id=${booking.barber.id}&date=${booking.date}&duration=${totalDuration}`)
      .then(r => r.json())
      .then((data: { available?: string[] }) => setAvailableSlots(data.available ?? []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [booking.date, booking.barber?.id, totalDuration])

  const handleDateTimeSelect = (date: string, time: string) => {
    setBooking(prev => ({ ...prev, date, time }))
    setStep("contact")
  }

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string

    setIsSubmitting(true)
    setSubmitError(null)

    const services = booking.services
    let currentTime = booking.time!

    for (const svc of services) {
      const res = await fetch("/api/bookings/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barbershop: "barber-manager",
          clientName: name,
          clientPhone: phone,
          clientEmail: email || undefined,
          serviceId: svc.id,
          serviceName: svc.name,
          employeeId: booking.barber!.id,
          employeeName: booking.barber!.name,
          date: booking.date,
          time: currentTime,
          duration: svc.duration,
          price: svc.price,
        }),
      })

      const result = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !result.success) {
        setSubmitError(result.error ?? "Error al guardar la reserva. Intenta nuevamente.")
        setIsSubmitting(false)
        return
      }

      currentTime = addTime(currentTime, svc.duration)
    }

    setIsSubmitting(false)
    setBooking(prev => ({ ...prev, name, phone, email }))
    setStep("confirmation")
    setTimeout(() => setShowSignupModal(true), 2000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T12:00:00")
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')} 
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reserva tu cita</h1>
          <p className="text-gray-600">Proceso simple en 4 pasos</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <Badge variant={step === "service" ? "default" : "outline"}>1. Servicio</Badge>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <Badge variant={step === "barber" ? "default" : "outline"}>2. Barbero</Badge>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <Badge variant={step === "datetime" ? "default" : "outline"}>3. Fecha/Hora</Badge>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <Badge variant={step === "contact" ? "default" : "outline"}>4. Contacto</Badge>
        </div>

        {/* Step 1: Service Selection */}
        {step === "service" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Selecciona tus servicios
              </CardTitle>
              <CardDescription>Puedes elegir uno o varios servicios</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.services ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay servicios disponibles en este momento.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {services.map((service) => {
                      const selected = booking.services.some(s => s.id === service.id)
                      return (
                        <Card
                          key={service.id}
                          className={`cursor-pointer transition-all ${
                            selected
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-400"
                              : "hover:border-blue-300"
                          }`}
                          onClick={() =>
                            setBooking(prev => ({
                              ...prev,
                              services: selected
                                ? prev.services.filter(s => s.id !== service.id)
                                : [...prev.services, service],
                            }))
                          }
                        >
                          <CardContent className="pt-6 relative">
                            {selected && (
                              <span className="absolute top-3 right-3 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                ✓
                              </span>
                            )}
                            <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                            {service.description && (
                              <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-blue-600">${service.price}</span>
                              <Badge variant="outline">{service.duration} min</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Mini-cart */}
                  {booking.services.length > 0 && (
                    <div className="border rounded-lg bg-slate-50 p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-sm text-gray-700">Tu selección:</h4>
                      <ul className="space-y-1 mb-3">
                        {booking.services.map(s => (
                          <li key={s.id} className="flex justify-between text-sm">
                            <span>{s.name}</span>
                            <span className="text-gray-600">{s.duration} min · <strong>${s.price}</strong></span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between text-sm font-bold border-t pt-2">
                        <span>Total</span>
                        <span>
                          {booking.services.reduce((s, x) => s + x.duration, 0)} min
                          {" · "}
                          ${booking.services.reduce((s, x) => s + x.price, 0)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full gap-2"
                    disabled={booking.services.length === 0}
                    onClick={() => setStep("barber")}
                  >
                    Continuar con {booking.services.length} servicio{booking.services.length !== 1 ? "s" : ""}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Barber Selection */}
        {step === "barber" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Selecciona tu barbero
              </CardTitle>
              <CardDescription>
                {booking.services.map(s => s.name).join(" + ")}
                {" · "}${booking.services.reduce((t, s) => t + s.price, 0)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.employees ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">No hay barberos disponibles para este servicio.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setStep("service")}
                  >
                    Volver a servicios
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {employees.map((barber) => (
                    <Card 
                      key={barber.id}
                      className="cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => { setBooking(prev => ({ ...prev, barber })); setStep("datetime") }}
                    >
                      <CardContent className="pt-6 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <User className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="font-semibold mb-1">{barber.name}</h3>
                        {barber.specialty && (
                          <p className="text-sm text-gray-600 mb-1">{barber.specialty}</p>
                        )}
                        {barber.avg_rating !== null && barber.avg_rating !== undefined ? (
                          <div className="flex items-center justify-center gap-1 text-sm">
                            <span className="text-yellow-500">★</span>
                            <span className="font-medium">{barber.avg_rating}</span>
                            <span className="text-gray-400">({barber.total_ratings})</span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">Sin calificaciones</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <Button 
                variant="ghost" 
                onClick={() => setStep("service")} 
                className="mt-4 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Cambiar servicio
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Date & Time Selection */}
        {step === "datetime" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Selecciona fecha y hora
              </CardTitle>
              <CardDescription>
                {booking.services.map(s => s.name).join(" + ")} con {booking.barber?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Date Selection */}
                <div>
                  <Label className="mb-2 block">Selecciona una fecha</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableDates.map((dateStr) => (
                      <Button
                        key={dateStr}
                        variant={booking.date === dateStr ? "default" : "outline"}
                        onClick={() => setBooking(prev => ({ ...prev, date: dateStr, time: undefined }))}
                        className="flex flex-col h-auto py-3"
                      >
                        <span className="text-xs">{formatDate(dateStr).split(',')[0]}</span>
                        <span className="font-bold">{new Date(dateStr + "T12:00:00").getDate()}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                {booking.date && (
                  <div>
                    <Label className="mb-2 block">Selecciona una hora</Label>
                    {slotsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4">Sin horarios disponibles para esta fecha.</p>
                    ) : (
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {availableSlots.map((time) => (
                          <Button
                            key={time}
                            variant={booking.time === time ? "default" : "outline"}
                            onClick={() => handleDateTimeSelect(booking.date!, time)}
                            className="gap-2"
                          >
                            <Clock className="h-3 w-3" />
                            {time}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setStep("barber")} 
                className="mt-4 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Cambiar barbero
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Contact Information */}
        {step === "contact" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Tus datos de contacto
              </CardTitle>
              <CardDescription>
                Solo necesitamos tu nombre y teléfono para confirmar tu cita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Juan Pérez"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono / WhatsApp *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+507 6456-0263"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Te enviaremos un recordatorio por WhatsApp
                  </p>
                </div>

                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="mt-1"
                  />
                </div>

                {/* Summary */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Resumen de tu cita:</h4>
                    <ul className="space-y-1 text-sm">
                      {booking.services.map(s => (
                        <li key={s.id}>📋 <strong>{s.name}</strong> — {s.duration} min · ${s.price}</li>
                      ))}
                      <li>💈 <strong>Barbero:</strong> {booking.barber?.name}</li>
                      <li>📅 <strong>Fecha:</strong> {booking.date && formatDate(booking.date)}</li>
                      <li>🕐 <strong>Hora inicio:</strong> {booking.time}</li>
                      <li className="font-semibold">💰 <strong>Total:</strong> ${booking.services.reduce((t, s) => t + s.price, 0)} · {booking.services.reduce((t, s) => t + s.duration, 0)} min</li>
                    </ul>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setStep("datetime")}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Atrás
                  </Button>
                  <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                    ) : (
                      <>Confirmar Reserva <Check className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>

                {submitError && (
                  <p className="text-sm text-red-600 text-center">{submitError}</p>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Confirmation */}
        {step === "confirmation" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                ¡Reserva Confirmada!
              </h2>
              <p className="text-green-700 mb-6">
                Hemos guardado tu cita. Te enviaremos un recordatorio por WhatsApp.
              </p>

              <Card className="bg-white mb-6">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-4">Detalles de tu cita:</h4>
                  <div className="space-y-2 text-left">
                    {booking.services.map((s, i) => (
                      <div key={s.id} className="flex justify-between">
                        <span className="text-gray-600">Servicio {i + 1}:</span>
                        <span className="font-semibold">{s.name}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Barbero:</span>
                      <span className="font-semibold">{booking.barber?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-semibold">{booking.date && formatDate(booking.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hora inicio:</span>
                      <span className="font-semibold">{booking.time}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Total:</span>
                      <span className="text-xl font-bold text-blue-600">
                        ${booking.services.reduce((t, s) => t + s.price, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button 
                  onClick={() => router.push('/auth/register')} 
                  className="w-full gap-2"
                >
                  <User className="h-4 w-4" />
                  Crear cuenta para ver tu historial
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/')} 
                  className="w-full"
                >
                  Volver al inicio
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                💡 Al crear una cuenta podrás ver tu historial, acumular puntos y más
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Signup Prompt Modal */}
      {booking.name && booking.phone && (
        <SignupPromptModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          guestData={{
            name: booking.name,
            email: booking.email,
            phone: booking.phone
          }}
        />
      )}
    </div>
  )
}
