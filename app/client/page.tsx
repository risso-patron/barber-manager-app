"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, Star, History, Settings } from "lucide-react"

interface Appointment {
  id: string
  service: string
  barber: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
}

export default function ClientDashboard() {
  const router = useRouter()
  const user = useRequireAuth(["client", "admin"])
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "1",
      service: "Corte de cabello",
      barber: "Carlos Martínez",
      date: "2025-11-28",
      time: "15:00",
      status: "confirmed",
    },
    {
      id: "2",
      service: "Barba y bigote",
      barber: "María García",
      date: "2025-12-05",
      time: "10:30",
      status: "pending",
    },
  ])

  const [pastAppointments] = useState<Appointment[]>([
    {
      id: "3",
      service: "Corte + Barba",
      barber: "Carlos Martínez",
      date: "2025-11-15",
      time: "14:00",
      status: "completed",
    },
    {
      id: "4",
      service: "Corte de cabello",
      barber: "Pedro López",
      date: "2025-10-28",
      time: "16:00",
      status: "completed",
    },
  ])

  if (!user) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmada"
      case "pending":
        return "Pendiente"
      case "completed":
        return "Completada"
      case "cancelled":
        return "Cancelada"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mi Portal</h1>
              <p className="text-blue-100 mt-1">Gestiona tus citas y servicios</p>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Dashboard General
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximas Citas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appointments.length}</div>
                <p className="text-xs text-muted-foreground">Citas programadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Servicios Recibidos</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pastAppointments.length}</div>
                <p className="text-xs text-muted-foreground">Total completados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Barbero Favorito</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">Carlos M.</div>
                <p className="text-xs text-muted-foreground">3 servicios realizados</p>
              </CardContent>
            </Card>
          </div>

          {/* Book Appointment CTA */}
          <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
            <CardHeader>
              <CardTitle className="text-white">¿Listo para tu próximo corte?</CardTitle>
              <CardDescription className="text-purple-100">
                Reserva una cita con tu barbero favorito
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="bg-white text-purple-600 hover:bg-purple-50"
                onClick={() => router.push("/client/book")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Reservar Nueva Cita
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Próximas Citas</CardTitle>
                <CardDescription>Tus citas programadas</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push("/client/appointments")}
              >
                Ver todas
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments.length > 0 ? (
                  appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{appointment.service}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {appointment.barber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(appointment.date).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {appointment.time}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                          <>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes citas programadas
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Agenda tu próxima visita y mantén tu estilo impecable
                    </p>
                    <Button onClick={() => router.push("/client/book")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Reservar Ahora
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Past Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historial de Servicios</CardTitle>
                <CardDescription>Servicios completados</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push("/client/history")}
              >
                <History className="mr-2 h-3 w-3" />
                Ver historial completo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastAppointments.length > 0 ? (
                  pastAppointments.slice(0, 3).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{appointment.service}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                        <span>{appointment.barber}</span>
                        <span>•</span>
                        <span>
                          {new Date(appointment.date).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Star className="h-3 w-3 mr-1" />
                      Calificar
                    </Button>
                  </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aún no tienes servicios completados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
