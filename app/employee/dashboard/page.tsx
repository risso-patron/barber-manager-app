"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { type Appointment } from "@/lib/demo-appointments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Star,
  Bell,
  LogIn,
  LogOut as LogOutIcon
} from "lucide-react"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EmployeeDashboard() {
  const user = useRequireAuth(["employee"])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isWorking, setIsWorking] = useState(false)
  const [workStartTime, setWorkStartTime] = useState<string | null>(null)
  const [workEndTime, setWorkEndTime] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; createdAt: string }>>([])

  const loadAppointments = useCallback(async (employeeId: string, employeeName?: string) => {
    const { data } = await supabase
      .from("appointments")
      .select(`id, appointment_date, appointment_time, status, notes, rating, feedback, created_at,
        client:users!appointments_client_id_fkey(id, name, phone),
        service:services(id, name, price, duration)`)
      .eq("barber_id", employeeId)
      .order("appointment_date", { ascending: false })

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAppointments((data as any[]).map(a => ({
        id: a.id,
        clientId: a.client?.id || "",
        clientName: a.client?.name || "",
        clientPhone: a.client?.phone || "",
        employeeId,
        employeeName: employeeName || "Empleado",
        serviceId: a.service?.id || "",
        serviceName: a.service?.name || "",
        date: a.appointment_date,
        time: a.appointment_time,
        duration: a.service?.duration || 0,
        price: a.service?.price || 0,
        status: a.status,
        notes: a.notes || "",
        rating: a.rating ?? undefined,
        feedback: a.feedback ?? undefined,
        createdAt: a.created_at,
      })))
    }
  }, [])

  useEffect(() => {
    if (!user) return
    void loadAppointments(user.id, (user as { name?: string }).name)

    const channel = supabase
      .channel(`employee-appointments-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `barber_id=eq.${user.id}`,
        },
        (payload) => {
          let message = "Tu agenda fue actualizada"
          if (payload.eventType === "INSERT") message = "Nueva cita asignada"
          if (payload.eventType === "DELETE") message = "Se eliminó una cita"
          if (payload.eventType === "UPDATE") {
            const newStatus = (payload.new as { status?: string })?.status
            message = newStatus
              ? `Estado actualizado: ${newStatus}`
              : "Una cita fue actualizada"
          }

          setNotifications((prev) => [
            {
              id: `${Date.now()}-${payload.eventType}`,
              message,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 8))

          void loadAppointments(user.id, (user as { name?: string }).name)
        }
      )
      .subscribe()

      // Check if already working (from localStorage)
      const workStatus = localStorage.getItem(`work_status_${user.id}`)
      if (workStatus) {
        const status = JSON.parse(workStatus)
        setIsWorking(status.isWorking)
        setWorkStartTime(status.startTime)
      }

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, loadAppointments])

  const todayDate = new Date().toISOString().split('T')[0]
  
  const stats = useMemo(() => {
    const today = appointments.filter(apt => apt.date === todayDate)
    const thisWeek = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      const now = new Date()
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      return aptDate >= weekStart
    })
    const completed = appointments.filter(apt => apt.status === "completed")
    const rated = completed.filter((apt) => apt.rating !== null && apt.rating !== undefined && apt.rating > 0)
    const avgRating = rated.length > 0
      ? rated.reduce((sum: number, apt) => sum + (apt.rating || 0), 0) / rated.length
      : null
    const pending = today.filter(apt => apt.status === "pending")
    const confirmed = today.filter(apt => apt.status === "confirmed")
    const totalRevenue = completed.reduce((sum, apt) => sum + apt.price, 0)
    const todayRevenue = today.filter(apt => apt.status === "completed").reduce((sum, apt) => sum + apt.price, 0)

    return {
      todayAppointments: today.length,
      pendingToday: pending.length,
      confirmedToday: confirmed.length,
      weekAppointments: thisWeek.length,
      totalCompleted: completed.length,
      totalRevenue,
      todayRevenue,
      avgRating,
      ratedCount: rated.length,
    }
  }, [appointments, todayDate])

  const todayAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.date === todayDate)
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [appointments, todayDate])

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.date)
        const today = new Date(todayDate!)
        return aptDate > today && apt.status !== "cancelled"
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 5)
  }, [appointments, todayDate])

  const handleClockIn = () => {
    const now = new Date().toISOString()
    setIsWorking(true)
    setWorkStartTime(now)
    if (user) {
      localStorage.setItem(`work_status_${user.id}`, JSON.stringify({
        isWorking: true,
        startTime: now
      }))
    }
  }

  const handleClockOut = () => {
    const now = new Date().toISOString()
    setIsWorking(false)
    setWorkEndTime(now)
    if (user) {
      localStorage.removeItem(`work_status_${user.id}`)
      // In a real app, save work session to database
    }
  }

  const handleCompleteAppointment = async (id: string) => {
    await supabase.from("appointments").update({ status: "completed" }).eq("id", id)
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, status: "completed" as const } : apt
    ))
  }

  const handleCancelAppointment = async (id: string) => {
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id)
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, status: "cancelled" as const } : apt
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "confirmed": return "bg-blue-100 text-blue-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "cancelled": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "confirmed": return <Calendar className="h-4 w-4" />
      case "pending": return <AlertCircle className="h-4 w-4" />
      case "cancelled": return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getWorkDuration = () => {
    if (!workStartTime) return "00:00:00"
    const start = new Date(workStartTime)
    const end = workEndTime ? new Date(workEndTime) : new Date()
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  if (!user) return null

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mi Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido, {user.name}</p>
        </div>
        <div className="flex gap-2">
          {!isWorking ? (
            <Button onClick={handleClockIn} className="bg-green-600 hover:bg-green-700">
              <LogIn className="mr-2 h-4 w-4" />
              Iniciar Jornada
            </Button>
          ) : (
            <Button onClick={handleClockOut} variant="destructive">
              <LogOutIcon className="mr-2 h-4 w-4" />
              Finalizar Jornada
            </Button>
          )}
        </div>
      </div>

      {/* Work Status */}
      {isWorking && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium">Jornada Activa</p>
                  <p className="text-sm text-muted-foreground">
                    Inicio: {workStartTime && formatTime(workStartTime)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{getWorkDuration()}</p>
                <p className="text-sm text-muted-foreground">Tiempo trabajado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notificaciones en Tiempo Real
          </CardTitle>
          <CardDescription>Cambios recientes en tus citas</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin notificaciones recientes</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                  <p className="text-sm font-medium">{item.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.confirmedToday} confirmadas, {stats.pendingToday} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekAppointments}</div>
            <p className="text-xs text-muted-foreground">Citas programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompleted}</div>
            <p className="text-xs text-muted-foreground">Total histórico</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.todayRevenue}</div>
            <p className="text-xs text-muted-foreground">
              Total: ${stats.totalRevenue}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Agenda de Hoy</CardTitle>
            <CardDescription>
              {new Date(todayDate!).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tienes citas programadas para hoy</p>
                </div>
              ) : (
                todayAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{apt.time}</p>
                        <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(apt.status)}`}>
                          {getStatusIcon(apt.status)}
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold">{apt.clientName}</p>
                      <p className="text-sm text-muted-foreground">{apt.serviceName}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{apt.duration} min</span>
                        <span>${apt.price}</span>
                      </div>
                      {apt.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">Nota: {apt.notes}</p>
                      )}
                      {apt.status === "confirmed" && (
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => handleCompleteAppointment(apt.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCancelAppointment(apt.id)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
            <CardDescription>Tus próximas citas programadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tienes citas próximas programadas</p>
                </div>
              ) : (
                upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">
                          {new Date(apt.date).toLocaleDateString('es-ES', { 
                            month: 'short', 
                            day: 'numeric' 
                          })} - {apt.time}
                        </p>
                        <Badge variant="outline" className={getStatusColor(apt.status)}>
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold">{apt.clientName}</p>
                      <p className="text-sm text-muted-foreground">{apt.serviceName}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{apt.duration} min</span>
                        <span>${apt.price}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resumen de Rendimiento</CardTitle>
          <CardDescription>Tus estadísticas generales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appointments.filter(a => a.status === "completed").length}</p>
                <p className="text-sm text-muted-foreground">Clientes Atendidos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.totalRevenue}</p>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.avgRating !== null ? stats.avgRating.toFixed(1) : "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.avgRating !== null                    ? `Calificación Promedio (${stats.ratedCount})`
                    : "Sin calificaciones aún"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
