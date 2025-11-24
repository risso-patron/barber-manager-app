"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, DollarSign, TrendingUp, CheckCircle, User } from "lucide-react"

interface TodayAppointment {
  id: string
  client: string
  service: string
  time: string
  status: "pending" | "confirmed" | "in-progress" | "completed"
}

export default function BarberDashboard() {
  const router = useRouter()
  const [isWorking, setIsWorking] = useState(false)
  const [workStartTime, setWorkStartTime] = useState<string | null>(null)

  const [todayAppointments] = useState<TodayAppointment[]>([
    {
      id: "1",
      client: "Juan Pérez",
      service: "Corte de cabello",
      time: "09:00",
      status: "completed",
    },
    {
      id: "2",
      client: "María González",
      service: "Corte + Barba",
      time: "10:30",
      status: "completed",
    },
    {
      id: "3",
      client: "Carlos Rodríguez",
      service: "Barba y bigote",
      time: "12:00",
      status: "in-progress",
    },
    {
      id: "4",
      client: "Ana Martínez",
      service: "Corte de cabello",
      time: "14:00",
      status: "confirmed",
    },
    {
      id: "5",
      client: "Pedro López",
      service: "Corte + Barba",
      time: "15:30",
      status: "confirmed",
    },
  ])

  const stats = {
    todayAppointments: 5,
    completedToday: 2,
    weeklyAppointments: 23,
    monthlyRevenue: 3200,
    averageRating: 4.8,
    totalClients: 45,
  }

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/auth/login")
      return
    }

    const user = JSON.parse(currentUser)
    if (user.role !== "employee" && user.role !== "barber") {
      router.push("/dashboard")
    }

    // Check if already working
    const workStatus = localStorage.getItem("workStatus")
    if (workStatus) {
      const status = JSON.parse(workStatus)
      setIsWorking(status.isWorking)
      setWorkStartTime(status.startTime)
    }
  }, [router])

  const handleClockIn = () => {
    const now = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
    setIsWorking(true)
    setWorkStartTime(now)
    localStorage.setItem(
      "workStatus",
      JSON.stringify({ isWorking: true, startTime: now })
    )
  }

  const handleClockOut = () => {
    setIsWorking(false)
    setWorkStartTime(null)
    localStorage.removeItem("workStatus")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "confirmed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada"
      case "in-progress":
        return "En progreso"
      case "confirmed":
        return "Confirmada"
      case "pending":
        return "Pendiente"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mi Espacio de Trabajo</h1>
              <p className="text-indigo-100 mt-1">
                {new Date().toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isWorking ? (
                <div className="text-right">
                  <div className="text-sm text-indigo-100">Jornada iniciada</div>
                  <div className="text-lg font-semibold">{workStartTime}</div>
                </div>
              ) : null}
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="bg-white text-indigo-600 hover:bg-indigo-50"
              >
                Dashboard General
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Clock In/Out */}
          <Card className={isWorking ? "border-green-500 bg-green-50" : "border-orange-500 bg-orange-50"}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {isWorking ? "Jornada Activa" : "Jornada No Iniciada"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isWorking
                      ? `Comenzaste a las ${workStartTime}`
                      : "Marca tu entrada para comenzar"}
                  </p>
                </div>
                <Button
                  onClick={isWorking ? handleClockOut : handleClockIn}
                  size="lg"
                  className={isWorking ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                  <Clock className="mr-2 h-5 w-5" />
                  {isWorking ? "Marcar Salida" : "Marcar Entrada"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedToday} completadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.weeklyAppointments}</div>
                <p className="text-xs text-muted-foreground">Servicios realizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.monthlyRevenue}</div>
                <p className="text-xs text-muted-foreground">Generados este mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valoración</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageRating} ⭐</div>
                <p className="text-xs text-muted-foreground">Promedio de calificación</p>
              </CardContent>
            </Card>
          </div>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Agenda del Día</CardTitle>
              <CardDescription>Tus citas programadas para hoy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-lg font-bold">{appointment.time}</div>
                        <div className="text-xs text-gray-500">
                          {appointment.time.split(":")[0] < "12" ? "AM" : "PM"}
                        </div>
                      </div>
                      <div className="h-12 w-px bg-gray-200" />
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{appointment.client}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{appointment.service}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {appointment.status === "confirmed" && (
                        <Button size="sm">Iniciar</Button>
                      )}
                      {appointment.status === "in-progress" && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Completar
                        </Button>
                      )}
                      {appointment.status === "completed" && (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
