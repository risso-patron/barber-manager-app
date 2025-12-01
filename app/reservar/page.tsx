"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  Mail,
  ArrowLeft,
  ArrowRight,
  Check
} from "lucide-react"
import { DEMO_SERVICES, DEMO_EMPLOYEES } from "@/lib/demo-config"

type Step = "service" | "barber" | "datetime" | "contact" | "confirmation"

interface BookingData {
  service?: typeof DEMO_SERVICES[0]
  barber?: typeof DEMO_EMPLOYEES[0]
  date?: string
  time?: string
  name?: string
  phone?: string
  email?: string
}

export default function ReservarPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("service")
  const [booking, setBooking] = useState<BookingData>({})
  const [showSignupModal, setShowSignupModal] = useState(false)

  // Generate available time slots
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
  ]

  // Generate next 14 days
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date.toISOString().split('T')[0]
  })

  const handleServiceSelect = (service: typeof DEMO_SERVICES[0]) => {
    setBooking({ ...booking, service })
    setStep("barber")
  }

  const handleBarberSelect = (barber: typeof DEMO_EMPLOYEES[0]) => {
    setBooking({ ...booking, barber })
    setStep("datetime")
  }

  const handleDateTimeSelect = (date: string, time: string) => {
    setBooking({ ...booking, date, time })
    setStep("contact")
  }

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string

    setBooking({ ...booking, name, phone, email })
    
    // Save guest appointment to localStorage
    const guestAppointments = JSON.parse(localStorage.getItem("guestAppointments") || "[]")
    const newAppointment = {
      id: `guest-${Date.now()}`,
      ...booking,
      name,
      phone,
      email,
      status: "pending",
      createdAt: new Date().toISOString()
    }
    guestAppointments.push(newAppointment)
    localStorage.setItem("guestAppointments", JSON.stringify(guestAppointments))
    
    setStep("confirmation")
    
    // Show signup modal after 2 seconds
    setTimeout(() => {
      setShowSignupModal(true)
    }, 2000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
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
                Selecciona tu servicio
              </CardTitle>
              <CardDescription>Elige el servicio que deseas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEMO_SERVICES.map((service) => (
                  <Card 
                    key={service.id}
                    className="cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-blue-600">${service.price}</span>
                        <Badge variant="outline">{service.duration} min</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                Servicio: <strong>{booking.service?.name}</strong> - ${booking.service?.price}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DEMO_EMPLOYEES.map((barber) => (
                  <Card 
                    key={barber.id}
                    className="cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => handleBarberSelect(barber)}
                  >
                    <CardContent className="pt-6 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold mb-2">{barber.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {barber.specialties.join(", ")}
                      </p>
                      <Badge variant="outline">⭐ {barber.rating}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                {booking.service?.name} con {booking.barber?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Date Selection */}
                <div>
                  <Label className="mb-2 block">Selecciona una fecha</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableDates.map((date) => (
                      <Button
                        key={date}
                        variant={booking.date === date ? "default" : "outline"}
                        onClick={() => setBooking({ ...booking, date })}
                        className="flex flex-col h-auto py-3"
                      >
                        <span className="text-xs">{formatDate(date).split(',')[0]}</span>
                        <span className="font-bold">{new Date(date).getDate()}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                {booking.date && (
                  <div>
                    <Label className="mb-2 block">Selecciona una hora</Label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {timeSlots.map((time) => (
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
                      <li>📋 <strong>Servicio:</strong> {booking.service?.name}</li>
                      <li>💈 <strong>Barbero:</strong> {booking.barber?.name}</li>
                      <li>📅 <strong>Fecha:</strong> {booking.date && formatDate(booking.date)}</li>
                      <li>🕐 <strong>Hora:</strong> {booking.time}</li>
                      <li>💰 <strong>Precio:</strong> ${booking.service?.price}</li>
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
                  <Button type="submit" className="flex-1 gap-2">
                    Confirmar Reserva
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Servicio:</span>
                      <span className="font-semibold">{booking.service?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Barbero:</span>
                      <span className="font-semibold">{booking.barber?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-semibold">{booking.date && formatDate(booking.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hora:</span>
                      <span className="font-semibold">{booking.time}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Total:</span>
                      <span className="text-xl font-bold text-blue-600">${booking.service?.price}</span>
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
