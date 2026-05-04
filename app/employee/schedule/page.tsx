"use client"

import { useState, useMemo, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { type Appointment } from "@/lib/demo-appointments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Calendar, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EmployeeSchedulePage() {
  const user = useRequireAuth(["employee", "admin"])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    if (!user) return
    supabase
      .from("appointments")
      .select(`id, appointment_date, appointment_time, status, notes, created_at,
        client:users!appointments_client_id_fkey(id, name, phone),
        service:services(id, name, price, duration)`)
      .eq("barber_id", user.id)
      .order("appointment_date")
      .then(({ data }) => {
        if (data) setAppointments((data as any[]).map(a => ({
          id: a.id,
          clientId: a.client?.id || "",
          clientName: a.client?.name || "",
          clientPhone: a.client?.phone || "",
          employeeId: user.id,
          employeeName: user.name,
          serviceId: a.service?.id || "",
          serviceName: a.service?.name || "",
          date: a.appointment_date,
          time: a.appointment_time,
          duration: a.service?.duration || 0,
          price: a.service?.price || 0,
          status: a.status,
          notes: a.notes || "",
          createdAt: a.created_at,
        })))
      })
  }, [user])

  const formattedDate = selectedDate.toISOString().split('T')[0]

  const dayAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.date === formattedDate)
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [appointments, formattedDate])

  const weekAppointments = useMemo(() => {
    const weekStart = new Date(selectedDate)
    weekStart.setDate(selectedDate.getDate() - selectedDate.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.date)
        return aptDate >= weekStart && aptDate <= weekEnd
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  }, [appointments, selectedDate])

  const stats = useMemo(() => {
    const completed = dayAppointments.filter(apt => apt.status === "completed").length
    const pending = dayAppointments.filter(apt => apt.status === "pending").length
    const confirmed = dayAppointments.filter(apt => apt.status === "confirmed").length
    const totalRevenue = dayAppointments
      .filter(apt => apt.status === "completed")
      .reduce((sum, apt) => sum + apt.price, 0)

    return { completed, pending, confirmed, totalRevenue }
  }, [dayAppointments])

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
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

  const isToday = formattedDate === new Date().toISOString().split('T')[0]

  if (!user) return null

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mi Agenda</h1>
        <p className="text-muted-foreground">Gestiona tus citas y horarios</p>
      </div>

      {/* Date Navigation */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {selectedDate.toLocaleDateString('es-ES', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
              {!isToday && (
                <Button variant="link" onClick={goToToday} className="mt-1">
                  Ir a hoy
                </Button>
              )}
            </div>
            
            <Button variant="outline" onClick={goToNextDay}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats for selected day */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Citas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayAppointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalRevenue}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Day Schedule */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Horario del Día</CardTitle>
              <CardDescription>
                {dayAppointments.length} cita{dayAppointments.length !== 1 ? 's' : ''} programada{dayAppointments.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dayAppointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No hay citas para este día</p>
                  <p className="text-sm">Selecciona otro día para ver tu agenda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 text-center min-w-[80px]">
                          <div className="text-2xl font-bold">{apt.time}</div>
                          <div className="text-xs text-muted-foreground">
                            {apt.duration} min
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-lg">{apt.serviceName}</h4>
                            <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(apt.status)}`}>
                              {getStatusIcon(apt.status)}
                              {apt.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium text-foreground">{apt.clientName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{apt.clientPhone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium text-green-600">${apt.price}</span>
                            </div>
                          </div>

                          {apt.notes && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                              <span className="font-medium">Nota:</span> {apt.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Week Overview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Vista Semanal</CardTitle>
              <CardDescription>Resumen de la semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const weekStart = new Date(selectedDate)
                  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay())
                  
                  const days = Array.from({ length: 7 }, (_, i) => {
                    const day = new Date(weekStart)
                    day.setDate(weekStart.getDate() + i)
                    const dateStr = day.toISOString().split('T')[0]
                    const aptsForDay = weekAppointments.filter(apt => apt.date === dateStr)
                    const isSelected = dateStr === formattedDate
                    const isCurrentDay = dateStr === new Date().toISOString().split('T')[0]
                    
                    return (
                      <div
                        key={dateStr}
                        onClick={() => setSelectedDate(day)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'border-blue-600 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <p className={`font-medium ${isSelected ? 'text-blue-600' : ''}`}>
                              {day.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {day.getDate()} {day.toLocaleDateString('es-ES', { month: 'short' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{aptsForDay.length}</p>
                            {isCurrentDay && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                Hoy
                              </Badge>
                            )}
                          </div>
                        </div>
                        {aptsForDay.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {aptsForDay[0].time} - {aptsForDay[aptsForDay.length - 1].time}
                          </div>
                        )}
                      </div>
                    )
                  })
                  
                  return days
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
