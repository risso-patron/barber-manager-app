"use client"

import { useState, useMemo, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  User,
  Search,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Star,
  History as HistoryIcon
} from "lucide-react"

interface Appointment {
  id: string
  serviceName: string
  employeeName: string
  date: string
  time?: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  price: number
  notes?: string
}

interface AppointmentRow {
  id: string
  appointment_date: string
  appointment_time?: string | null
  status: Appointment["status"]
  notes?: string | null
  barber?: { id: string; name: string } | null
  service?: { id: string; name: string; price?: number } | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null

export default function ClientHistoryPage() {
  const user = useRequireAuth(["client"])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    if (!user) return
    if (!supabase) {
      setAllAppointments([])
      return
    }

    supabase
      .from("appointments")
      .select(`id, appointment_date, appointment_time, status, notes,
        barber:users!appointments_barber_id_fkey(id, name),
        service:services(id, name, price)`)
      .eq("client_id", user.id)
      .order("appointment_date", { ascending: false })
      .then(({ data }) => {
        if (data) setAllAppointments((data as AppointmentRow[]).map((a) => ({
          id: a.id,
          serviceName: a.service?.name || "",
          employeeName: a.barber?.name || "",
          date: a.appointment_date,
          time: a.appointment_time,
          status: a.status,
          price: a.service?.price || 0,
          notes: a.notes || undefined,
        })))
      })
  }, [user])

  const appointments = useMemo(() => {
    return allAppointments
  }, [allAppointments])

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = 
        apt.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === "all" || apt.status === filterStatus
      
      return matchesSearch && matchesStatus
    }).sort((a, b) => b.date.localeCompare(a.date))
  }, [appointments, searchTerm, filterStatus])

  const stats = useMemo(() => {
    const completed = appointments.filter(apt => apt.status === "completed")
    const cancelled = appointments.filter(apt => apt.status === "cancelled")
    const totalSpent = completed.reduce((sum, apt) => sum + apt.price, 0)
    
    // Favorite service
    const serviceCounts = completed.reduce((acc, apt) => {
      acc[apt.serviceName] = (acc[apt.serviceName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const favoriteService = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])[0]

    // Favorite barber
    const barberCounts = completed.reduce((acc, apt) => {
      acc[apt.employeeName] = (acc[apt.employeeName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const favoriteBarber = Object.entries(barberCounts)
      .sort((a, b) => b[1] - a[1])[0]

    return {
      total: appointments.length,
      completed: completed.length,
      cancelled: cancelled.length,
      totalSpent,
      favoriteService: favoriteService ? { name: favoriteService[0], count: favoriteService[1] } : null,
      favoriteBarber: favoriteBarber ? { name: favoriteBarber[0], count: favoriteBarber[1] } : null
    }
  }, [appointments])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200"
      case "confirmed": return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completada"
      case "confirmed": return "Confirmada"
      case "pending": return "Pendiente"
      case "cancelled": return "Cancelada"
      default: return status
    }
  }

  if (!user) return null

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Historial de Citas</h1>
        <p className="text-muted-foreground">Revisa todas tus citas anteriores y estadísticas</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Citas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.cancelled} canceladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalSpent}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.completed > 0 ? (stats.totalSpent / stats.completed).toFixed(2) : 0} promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8 ⭐</div>
            <p className="text-xs text-muted-foreground">
              Calificación promedio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Favorites */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Servicio Favorito
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.favoriteService ? (
              <div>
                <p className="text-2xl font-bold mb-1">{stats.favoriteService.name}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.favoriteService.count} veces solicitado
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No hay datos suficientes</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Barbero Favorito
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.favoriteBarber ? (
              <div>
                <p className="text-2xl font-bold mb-1">{stats.favoriteBarber.name}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.favoriteBarber.count} citas atendidas
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No hay datos suficientes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por servicio o barbero..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              aria-label="Filtrar citas por estado"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Todos los estados</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="confirmed">Confirmadas</option>
              <option value="pending">Pendientes</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            Todas las Citas ({filteredAppointments.length})
          </CardTitle>
          <CardDescription>
            Historial completo ordenado por fecha
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HistoryIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No se encontraron citas</p>
              <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((apt) => (
                <div key={apt.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{apt.serviceName}</h4>
                        <Badge variant="outline" className={getStatusColor(apt.status)}>
                          {getStatusText(apt.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(apt.date).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {apt.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {apt.employeeName}
                        </div>
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <DollarSign className="h-3 w-3" />
                          ${apt.price}
                        </div>
                      </div>

                      {apt.notes && (
                        <div className="mt-2 text-sm text-muted-foreground italic">
                          Nota: {apt.notes}
                        </div>
                      )}
                    </div>

                    {apt.status === "completed" && (
                      <Button size="sm" variant="outline">
                        <Star className="h-4 w-4 mr-1" />
                        Calificar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
