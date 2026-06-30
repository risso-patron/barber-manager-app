"use client"

import { useState, useMemo, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { maskPhone } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CalendarDays,
  List,
  Plus,
  Search,
  Clock,
  User,
  Scissors,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ShoppingCart,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  type Appointment,
  type AppointmentStatus,
  type Service,
  type Employee,
  type Client,
} from "@/lib/demo-appointments"
import { createBrowserClient } from "@supabase/ssr"
import { DEMO_APPOINTMENTS, DEMO_SERVICES, DEMO_EMPLOYEES, DEMO_CLIENTS } from "@/lib/demo-appointments"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

import { AppointmentModal } from "@/components/admin/appointments/appointment-modal"
import { DeleteConfirmModal } from "@/components/admin/appointments/delete-confirm-modal"

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending:   "orno-status-pending   border",
  confirmed: "orno-status-confirmed border",
  completed: "orno-status-completed border",
  cancelled: "orno-status-cancelled border",
  no_show:   "orno-status-no_show   border",
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show:   "No se presentó",
}

function getWeekDays(date: Date): Date[] {
  const monday = new Date(date)
  const day = monday.getDay()
  monday.setDate(date.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toDateStr(d: Date) { return d.toISOString().split("T")[0]! }

const WEEK_DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

interface AppointmentRow {
  id: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  notes?: string | null
  created_at: string
  client?: { id: string; name: string; phone?: string | null } | null
  barber?: { id: string; name: string; phone?: string | null } | null
  service?: { id: string; name: string; price?: number; duration?: number } | null
}

export default function AppointmentsPage() {
  const router = useRouter()
  const user = useRequireAuth(["admin", "manager"])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "all">("all")
  const [filterDate, setFilterDate] = useState("")

  // Pre-fill search from ?q= (e.g. coming from "Ver Agenda" in employees)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")
    if (q) setSearchTerm(q)
  }, [])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "week">("list")
  const [calendarDate, setCalendarDate] = useState(new Date())
  const PAGE_SIZE = 25

  // Load appointments from Supabase (or demo data)
  useEffect(() => {
    if (!supabase) {
      setAppointments(DEMO_APPOINTMENTS)
      setServices(DEMO_SERVICES)
      setEmployees(DEMO_EMPLOYEES)
      setClients(DEMO_CLIENTS.map(c => ({ ...c, email: c.email ?? "" })))
      setIsLoading(false)
      return
    }

    supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        created_at,
        client:users!appointments_client_id_fkey(id, name, phone),
        barber:users!appointments_barber_id_fkey(id, name),
        service:services(id, name, price, duration)
      `)
      .order("appointment_date", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setAppointments((data as unknown as AppointmentRow[]).map((raw) => {
            const client = raw.client
            const barber = raw.barber
            const service = raw.service
            return {
              id: raw.id,
              clientId: client?.id || "",
              clientName: client?.name || "",
              clientPhone: client?.phone || "",
              employeeId: barber?.id || "",
              employeeName: barber?.name || "",
              serviceId: service?.id || "",
              serviceName: service?.name || "",
              date: raw.appointment_date,
              time: raw.appointment_time,
              duration: service?.duration || 0,
              price: service?.price || 0,
              status: raw.status,
              notes: raw.notes || undefined,
              createdAt: raw.created_at,
            }
          }))
        }
        setIsLoading(false)
      })
    // Cargar servicios, empleados y clientes para los modales
// Cargar datos del modal vía API (service_role para evitar RLS)
    fetch("/api/appointments/form-data")
      .then(r => r.json())
      .then(({ clients, employees, services }) => {
        if (services) setServices(services.map((s: { id: string; name: string; price: number; duration: number }) => ({
          id: s.id, name: s.name, price: s.price, duration: s.duration,
        })))
        if (employees) setEmployees(employees.map((e: { id: string; name: string; phone: string | null }) => ({
          id: e.id, name: e.name, email: "", phone: e.phone || "", role: "employee" as const,
        })))
        if (clients) setClients(clients.map((c: { id: string; name: string; phone: string | null }) => ({
          id: c.id, name: c.name, email: "", phone: c.phone || "",
        })))
      })
      .catch(console.error)

  }, [])

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = 
        apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === "all" || apt.status === filterStatus
      const matchesDate = !filterDate || apt.date === filterDate

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [appointments, searchTerm, filterStatus, filterDate])

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [searchTerm, filterStatus, filterDate])

  const totalPages = Math.ceil(filteredAppointments.length / PAGE_SIZE)
  const pagedAppointments = filteredAppointments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayAppointments = appointments.filter(apt => apt.date === today)
    
    return {
      total: appointments.length,
      today: todayAppointments.length,
      pending: appointments.filter(apt => apt.status === "pending").length,
      confirmed: appointments.filter(apt => apt.status === "confirmed").length,
    }
  }, [appointments])

  const weekDays = useMemo(() => getWeekDays(calendarDate), [calendarDate])
  const weekLabel = useMemo(() => {
    const first = weekDays[0]!
    const last = weekDays[6]!
    const fmt = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    return first.getFullYear() === last.getFullYear()
      ? `${fmt(first)} – ${fmt(last)} ${first.getFullYear()}`
      : `${fmt(first)} ${first.getFullYear()} – ${fmt(last)} ${last.getFullYear()}`
  }, [weekDays])

  const handleCreateAppointment = async (appointment: Omit<Appointment, "id" | "createdAt">) => {
    // Demo mode: crear cita local
    if (!supabase) {
      const newAppt: Appointment = {
        ...appointment,
        id: `demo-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      setAppointments(prev => [newAppt, ...prev])
      setIsCreateModalOpen(false)
      return
    }

    let clientId = appointment.clientId

    // Si es un cliente nuevo, crearlo vía API (service role para evitar RLS)
    if (clientId === "__new__") {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: appointment.clientName, phone: appointment.clientPhone }),
      })
      const json = await res.json()
      if (!res.ok || !json.client) return
      clientId = json.client.id
      setClients(prev => [...prev, { id: clientId, name: appointment.clientName, phone: appointment.clientPhone, email: json.client.email || "" }])
    }

    // Crear la cita vía API (service role para evitar RLS de INSERT)
    const res = await fetch("/api/appointments/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        barber_id: appointment.employeeId,
        service_id: appointment.serviceId,
        appointment_date: appointment.date,
        appointment_time: appointment.time,
        status: appointment.status,
        notes: appointment.notes || null,
      }),
    })
    const json = await res.json()
    if (res.ok && json.appointment) {
      setAppointments([{ ...appointment, clientId, id: json.appointment.id, createdAt: json.appointment.created_at }, ...appointments])
    }
    setIsCreateModalOpen(false)
  }

  const handleUpdateAppointment = async (appointment: Appointment | Omit<Appointment, "id" | "createdAt">) => {
    const updatedAppointment = appointment as Appointment
    if (!supabase) {
      setAppointments(appointments.map(apt =>
        apt.id === updatedAppointment.id ? updatedAppointment : apt
      ))
      setEditingAppointment(null)
      return
    }
    const { error } = await supabase
      .from("appointments")
      .update({
        client_id: updatedAppointment.clientId,
        barber_id: updatedAppointment.employeeId,
        service_id: updatedAppointment.serviceId,
        appointment_date: updatedAppointment.date,
        appointment_time: updatedAppointment.time,
        status: updatedAppointment.status,
        notes: updatedAppointment.notes || null,
      })
      .eq("id", updatedAppointment.id)
    if (!error) {
      setAppointments(appointments.map(apt =>
        apt.id === updatedAppointment.id ? updatedAppointment : apt
      ))
    }
    setEditingAppointment(null)
  }

  const handleDeleteAppointment = async (id: string) => {
    if (!supabase) {
      setAppointments(appointments.filter(apt => apt.id !== id))
      setDeletingAppointment(null)
      return
    }
    const { error } = await supabase.from("appointments").delete().eq("id", id)
    if (!error) setAppointments(appointments.filter(apt => apt.id !== id))
    setDeletingAppointment(null)
  }

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    if (!supabase) {
      setAppointments(appointments.map(apt =>
        apt.id === id ? { ...apt, status: newStatus } : apt
      ))
      setActiveDropdown(null)
      return
    }

    const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", id)

    if (!error) {
      setAppointments(appointments.map(apt =>
        apt.id === id ? { ...apt, status: newStatus } : apt
      ))
    } else {
      const { data: fresh } = await supabase
        .from("appointments")
        .select("status")
        .eq("id", id)
        .single()

      if (fresh) {
        setAppointments(prev =>
          prev.map(apt => apt.id === id ? { ...apt, status: fresh.status as AppointmentStatus } : apt)
        )
        console.warn(
          `No se pudo cambiar el estado. La cita ya fue marcada como "${fresh.status}" y el listado fue actualizado.`
        )
      }
    }
    setActiveDropdown(null)
  }

  if (!user) return null

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 22, fontWeight: 600, color: "#F0F0F0", margin: 0 }}>Citas</h1>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "#8A8A8A", marginTop: 4 }}>Administra todas las citas de la barbería</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#2E2E2E" }}>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Vista lista"
              className="p-2 transition-colors"
              style={{ background: viewMode === "list" ? "#E53935" : "transparent", color: viewMode === "list" ? "#fff" : "#8A8A8A" }}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              title="Vista semanal"
              className="p-2 transition-colors"
              style={{ background: viewMode === "week" ? "#E53935" : "transparent", color: viewMode === "week" ? "#fff" : "#8A8A8A" }}
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#8A8A8A" }}>Total Citas</p>
                <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 28, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{stats.total}</p>
              </div>
              <Calendar className="h-7 w-7" style={{ color: "#E53935" }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#8A8A8A" }}>Hoy</p>
                <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 28, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{stats.today}</p>
              </div>
              <Clock className="h-7 w-7" style={{ color: "#22C55E" }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#8A8A8A" }}>Pendientes</p>
                <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 28, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{stats.pending}</p>
              </div>
              <Clock className="h-7 w-7" style={{ color: "#F59E0B" }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#8A8A8A" }}>Confirmadas</p>
                <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 28, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-7 w-7" style={{ color: "#818CF8" }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === "week" ? (
        <>
          {/* Week navigation */}
          <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: "#1A1A1A", border: "1px solid #2E2E2E" }}>
            <button
              type="button"
              onClick={() => { const d = new Date(calendarDate); d.setDate(d.getDate() - 7); setCalendarDate(d) }}
              className="p-1.5 rounded transition-colors"
              style={{ color: "#8A8A8A" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#F0F0F0" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#8A8A8A" }}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium" style={{ color: "#F0F0F0" }}>{weekLabel}</span>
            <button
              type="button"
              onClick={() => { const d = new Date(calendarDate); d.setDate(d.getDate() + 7); setCalendarDate(d) }}
              className="p-1.5 rounded transition-colors"
              style={{ color: "#8A8A8A" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#F0F0F0" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#8A8A8A" }}
              aria-label="Semana siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Week grid */}
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-2" style={{ minWidth: 700 }}>
              {weekDays.map((day, idx) => {
                const dateStr = toDateStr(day)
                const isToday = dateStr === toDateStr(new Date())
                const dayApts = appointments
                  .filter(a => a.date === dateStr)
                  .sort((a, b) => a.time.localeCompare(b.time))
                return (
                  <div
                    key={dateStr}
                    className="rounded-lg p-2"
                    style={{
                      background: isToday ? "rgba(229,57,53,0.06)" : "#1A1A1A",
                      border: `1px solid ${isToday ? "#E53935" : "#2E2E2E"}`,
                      minHeight: 120,
                    }}
                  >
                    <div className="text-center mb-2 pb-1" style={{ borderBottom: "1px solid #252525" }}>
                      <p className="text-[11px] uppercase tracking-wide" style={{ color: "#555" }}>{WEEK_DAY_LABELS[idx]}</p>
                      <p className="text-base font-bold leading-tight" style={{ color: isToday ? "#E53935" : "#F0F0F0" }}>
                        {day.getDate()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {isLoading ? (
                        <div className="flex justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#555" }} />
                        </div>
                      ) : dayApts.length === 0 ? (
                        <p className="text-[11px] text-center py-3" style={{ color: "#444" }}>Sin citas</p>
                      ) : (
                        dayApts.map(apt => (
                          <button
                            key={apt.id}
                            type="button"
                            onClick={() => setEditingAppointment(apt)}
                            className="w-full text-left rounded p-1.5 transition-colors"
                            style={{ background: "#252525", border: "1px solid #2E2E2E" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#303030" }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#252525" }}
                          >
                            <p className="text-[11px] font-semibold" style={{ color: "#F0F0F0" }}>{apt.time}</p>
                            <p className="text-[11px] truncate" style={{ color: "#A0A0A0" }}>{apt.clientName}</p>
                            <p className="text-[10px] truncate" style={{ color: "#666" }}>{apt.serviceName}</p>
                            <Badge className={`${STATUS_COLORS[apt.status]} text-[9px] px-1 py-0 mt-0.5 leading-tight`}>
                              {STATUS_LABELS[apt.status]}
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, empleado o servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              aria-label="Filtrar por estado"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | "all")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              placeholder="Filtrar por fecha"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Citas ({filteredAppointments.length})
            {totalPages > 1 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                — página {page + 1} de {totalPages}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {filterDate ? `Mostrando citas para ${filterDate}` : "Mostrando todas las citas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron citas</p>
              </div>
            ) : (
              <>
                {pagedAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                    className="border rounded-lg p-4 transition-colors" style={{ borderColor: "#2E2E2E", background: "#1A1A1A" }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#222222" }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#1A1A1A" }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={STATUS_COLORS[appointment.status]}>
                          {STATUS_LABELS[appointment.status]}
                        </Badge>
                        <span className="text-sm text-gray-600 hidden sm:inline">
                          {new Date(appointment.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-sm text-gray-600 sm:hidden">
                          {new Date(appointment.date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{appointment.clientName}</p>
                            <p className="text-xs text-gray-600">
                              {user?.role === "manager" ? maskPhone(appointment.clientPhone) : appointment.clientPhone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Scissors className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{appointment.serviceName}</p>
                            <p className="text-xs text-gray-600">
                              {appointment.duration} min · ${appointment.price}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{appointment.time}</p>
                            <p className="text-xs text-gray-600">{appointment.employeeName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {appointment.notes && (
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Notas:</span> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="relative ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveDropdown(activeDropdown === appointment.id ? null : appointment.id)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      {activeDropdown === appointment.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg border z-50" style={{ background: "#1A1A1A", borderColor: "#2E2E2E" }}>
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setEditingAppointment(appointment)
                                setActiveDropdown(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2" style={{ color: "#F0F0F0" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#252525" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </button>

                            {appointment.status === "pending" && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, "confirmed")}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Confirmar
                              </button>
                            )}

                            {appointment.status === "confirmed" && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, "completed")}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                Marcar como completada
                              </button>
                            )}

                            {(appointment.status === "confirmed" || appointment.status === "completed") && (
                              <button
                                onClick={() => {
                                  setActiveDropdown(null)
                                  router.push(`/admin/pos?appointment_id=${appointment.id}`)
                                }}
                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2" style={{ color: "#818CF8" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#252525" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                              >
                                <ShoppingCart className="h-4 w-4" style={{ color: "#818CF8" }} />
                                Cobrar en POS
                              </button>
                            )}

                            {appointment.status === "confirmed" && (
                              <button
                                onClick={() => {
                                  handleStatusChange(appointment.id, "no_show")
                                  setActiveDropdown(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2" style={{ color: "#F97316" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#2A1500" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                              >
                                <XCircle className="h-4 w-4" />
                                No se presentó
                              </button>
                            )}

                            {(appointment.status === "pending" || appointment.status === "confirmed") && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2" style={{ color: "#8A8A8A" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#252525" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                              >
                                <XCircle className="h-4 w-4" style={{ color: "#EF4444" }} />
                                Cancelar
                              </button>
                            )}

                            <div style={{ height: 1, background: "#252525", margin: "4px 0" }} />

                            <button
                              onClick={() => {
                                setDeletingAppointment(appointment)
                                setActiveDropdown(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 font-medium" style={{ color: "#EF4444" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1F1212" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredAppointments.length)} de {filteredAppointments.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                    >
                      ← Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Siguiente →
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

        </>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <AppointmentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateAppointment}
          services={services}
          employees={employees}
          clients={clients}
        />
      )}

      {editingAppointment && (
        <AppointmentModal
          isOpen={!!editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSave={handleUpdateAppointment}
          appointment={editingAppointment}
          services={services}
          employees={employees}
          clients={clients}
        />
      )}

      {deletingAppointment && (
        <DeleteConfirmModal
          isOpen={!!deletingAppointment}
          onClose={() => setDeletingAppointment(null)}
          onConfirm={() => handleDeleteAppointment(deletingAppointment.id)}
          appointmentInfo={`${deletingAppointment.clientName} - ${deletingAppointment.serviceName}`}
        />
      )}
    </div>
  )
}
