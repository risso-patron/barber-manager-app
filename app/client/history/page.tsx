"use client"

import { useState, useMemo, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RescheduleModal } from "@/components/client/RescheduleModal"
import { RatingModal } from "@/components/client/RatingModal"
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
  rating?: number | null
  review_text?: string | null
}

interface AppointmentRow {
  id: string
  appointment_date: string
  appointment_time?: string | null
  status: Appointment["status"]
  notes?: string | null
  rating?: number | null
  review_text?: string | null
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

  const handleRescheduleSuccess = (id: string, newDate: string, newTime: string) => {
    setAllAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id ? { ...apt, date: newDate, time: newTime, status: "confirmed" } : apt
      )
    )
  }

  useEffect(() => {
    if (!user) return
    if (!supabase) {
      setAllAppointments([])
      return
    }

    supabase
      .from("appointments")
      .select(`id, appointment_date, appointment_time, status, notes, rating, review_text,
        barber:users!appointments_barber_id_fkey(id, name),
        service:services(id, name, price)`)
      .eq("client_id", user.id)
      .order("appointment_date", { ascending: false })
      .then(({ data }) => {
        if (data) setAllAppointments((data as unknown as AppointmentRow[]).map((a) => ({
          id: a.id,
          serviceName: a.service?.name || "",
          employeeName: a.barber?.name || "",
          date: a.appointment_date,
          time: a.appointment_time ?? undefined,
          status: a.status,
          price: a.service?.price || 0,
          notes: a.notes || undefined,
          rating: a.rating ?? null,
          review_text: a.review_text ?? null,
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
    const rated = completed.filter(apt => apt.rating != null)
    const avgRating = rated.length > 0
      ? (rated.reduce((sum, apt) => sum + (apt.rating ?? 0), 0) / rated.length).toFixed(1)
      : null
    
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
      favoriteBarber: favoriteBarber ? { name: favoriteBarber[0], count: favoriteBarber[1] } : null,
      avgRating,
      ratedCount: rated.length,
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

  const statusColor: Record<string, string> = {
    confirmed: "#22C55E",
    pending:   "#F59E0B",
    completed: "#8A8A8A",
    cancelled: "#E53935",
  }

  return (
    <div style={{ padding: "24px 32px 80px" }}>
      <style>{`
        @keyframes ornoFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .orno-row { animation: ornoFadeUp 0.35s ease both; }
        .orno-row:nth-child(1) { animation-delay: 0.04s; }
        .orno-row:nth-child(2) { animation-delay: 0.10s; }
        .orno-row:nth-child(3) { animation-delay: 0.16s; }
        .orno-row:nth-child(4) { animation-delay: 0.22s; }
        .orno-row:nth-child(5) { animation-delay: 0.28s; }
        .orno-input { background: #111 !important; border: 1px solid #2E2E2E !important; color: #F0F0F0 !important; }
        .orno-input::placeholder { color: #555555 !important; }
        .orno-select { background: #111; border: 1px solid #2E2E2E; color: #F0F0F0; padding: 8px 12px; outline: none; border-radius: 4px; font-family: var(--font-dm-sans); font-size: 12px; cursor: pointer; }
        .orno-select option { background: #1A1A1A; }
      `}</style>

      {/* Header */}
      <div className="pt-8 pb-3">
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(28px,4vw,40px)", fontWeight: 300, color: "#F0F0F0", letterSpacing: "-0.02em" }}>Historial</p>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>Todas tus citas anteriores</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderTop: "1px solid #252525", marginBottom: "32px" }}>
        {[
          { value: String(stats.total),     label: "Total citas",   sub: `${stats.completed} completadas` },
          { value: `$${stats.totalSpent}`,  label: "Total gastado", sub: `$${stats.completed > 0 ? (stats.totalSpent / stats.completed).toFixed(0) : 0} prom.` },
          { value: stats.avgRating ? `${stats.avgRating}★` : "—", label: "Satisfacción", sub: stats.ratedCount > 0 ? `${stats.ratedCount} calificadas` : "Sin datos" },
          { value: String(stats.cancelled), label: "Canceladas", sub: "Total" },
        ].map((s, i) => (
          <div key={i} className="orno-row" style={{ padding: "20px 0", borderRight: i < 3 ? "1px solid #252525" : "none", paddingLeft: i > 0 ? "20px" : 0, paddingRight: i < 3 ? "20px" : 0 }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(22px,3vw,34px)", fontWeight: 300, lineHeight: 1, color: "#F0F0F0" }}>{s.value}</p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#555555", marginTop: "2px" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Favorites */}
      {(stats.favoriteService || stats.favoriteBarber) && (
        <div className="grid gap-4 md:grid-cols-2" style={{ marginBottom: "32px" }}>
          {stats.favoriteService && (
            <div style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: "8px", padding: "20px" }}>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: "8px" }}>Servicio favorito</p>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "22px", fontWeight: 400, color: "#F0F0F0" }}>{stats.favoriteService.name}</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#555555", marginTop: "4px" }}>{stats.favoriteService.count} veces solicitado</p>
            </div>
          )}
          {stats.favoriteBarber && (
            <div style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: "8px", padding: "20px" }}>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: "8px" }}>Barbero favorito</p>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "22px", fontWeight: 400, color: "#F0F0F0" }}>{stats.favoriteBarber.name}</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#555555", marginTop: "4px" }}>{stats.favoriteBarber.count} citas atendidas</p>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#555555" }} />
          <Input
            placeholder="Buscar por servicio o barbero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="orno-input pl-9"
            style={{ paddingLeft: "36px" }}
          />
        </div>
        <select
          aria-label="Filtrar por estado"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="orno-select"
        >
          <option value="all">Todos los estados</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
          <option value="confirmed">Confirmadas</option>
          <option value="pending">Pendientes</option>
        </select>
      </div>

      {/* Timeline */}
      <div style={{ borderTop: "1px solid #252525" }}>
        {filteredAppointments.length === 0 ? (
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 300, color: "#555555", padding: "24px 0" }}>Sin resultados para los filtros actuales</p>
        ) : (
          filteredAppointments.map((apt, i) => (
            <div key={apt.id} className="orno-row" style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "flex-start", gap: "18px" }}>
              <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "#555555", minWidth: "18px", paddingTop: "3px" }}>{String(i + 1).padStart(2, "0")}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "19px", fontWeight: 400, color: "#F0F0F0" }}>{apt.serviceName}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: statusColor[apt.status] ?? "#555555" }}>
                      {getStatusText(apt.status)}
                    </span>
                    {apt.price > 0 && (
                      <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "12px", color: "#8A8A8A" }}>${apt.price}</span>
                    )}
                  </div>
                </div>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginTop: "3px" }}>
                  {new Date(apt.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                  {apt.time ? ` · ${apt.time}` : ""}
                  {apt.employeeName ? ` · ${apt.employeeName}` : ""}
                </p>
                {apt.notes && (
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#555555", marginTop: "3px", fontStyle: "italic" }}>{apt.notes}</p>
                )}
                <div style={{ display: "flex", gap: "12px", marginTop: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  {(apt.status === "pending" || apt.status === "confirmed") && (
                    <RescheduleModal
                      appointment={apt}
                      onSuccess={(newDate, newTime) => handleRescheduleSuccess(apt.id, newDate, newTime)}
                    />
                  )}
                  {apt.status === "completed" && (
                    <RatingModal
                      appointment={apt}
                      onSuccess={(rating, reviewText) =>
                        setAllAppointments((prev) =>
                          prev.map((a) => a.id === apt.id ? { ...a, rating, review_text: reviewText ?? null } : a)
                        )
                      }
                    />
                  )}
                  {apt.status === "completed" && apt.rating != null && apt.rating > 0 && (
                    <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "#F59E0B" }}>
                      {"★".repeat(apt.rating)}{"☆".repeat(5 - apt.rating)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
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
            <div className="text-2xl font-bold">
              {stats.avgRating ? `${stats.avgRating} ⭐` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.ratedCount > 0
                ? `${stats.ratedCount} cita${stats.ratedCount > 1 ? "s" : ""} calificada${stats.ratedCount > 1 ? "s" : ""}`
                : "Sin calificaciones aún"}
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

                    <div className="flex flex-col gap-2 items-end shrink-0">
                      {(apt.status === "pending" || apt.status === "confirmed") && (
                        <RescheduleModal
                          appointment={apt}
                          onSuccess={(newDate, newTime) =>
                            handleRescheduleSuccess(apt.id, newDate, newTime)
                          }
                        />
                      )}
                      {apt.status === "completed" && (
                        <RatingModal
                          appointment={apt}
                          onSuccess={(rating, reviewText) =>
                            setAllAppointments((prev) =>
                              prev.map((a) =>
                                a.id === apt.id
                                  ? { ...a, rating, review_text: reviewText ?? null }
                                  : a
                              )
                            )
                          }
                        />
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
  )
}
