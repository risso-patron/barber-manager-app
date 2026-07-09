"use client"

// ORNO · Agenda (admin) — reconstruida sobre el M4 Scheduling Kit.
//
// Dos representaciones de la MISMA fuente de datos, filtros y permisos:
//   · Board (predeterminada) — operación del día: columnas por barbero,
//     drag-to-move con commit optimista + Deshacer, huecos sugeridos,
//     bloqueos, línea de "ahora".
//   · Lista — búsqueda histórica, auditoría y gestión masiva (paginada).
//
// Sustitución de infraestructura, NO reescritura funcional:
//   · Mismas queries Supabase (select con joins client/barber/service).
//   · Mismas rutas API (/api/appointments/admin, /api/clients,
//     /api/appointments/form-data, /api/schedule-blocks).
//   · Mismos handlers CRUD y transiciones de estado.
//   · Mismo modelo de permisos y RLS (mover = update de fecha/hora/barbero,
//     la misma mutación que ya ejercía handleUpdateAppointment).
//   · Resize deshabilitado (allowResize=false): la cita no persiste duración.

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import {
  Calendar,
  CalendarDays,
  List,
  Plus,
  Clock,
  User,
  Scissors,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { StatCard, StatStrip } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { useNotify } from "@/components/ui/notify"
import { AppointmentModal } from "@/components/admin/appointments/appointment-modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

import { AppointmentTimeline } from "@/components/scheduling/appointment-timeline"
import type {
  SchedAppointment,
  SchedResource,
  ScheduleBlock as SchedBlock,
  ScheduleConfig,
} from "@/components/scheduling/types"

import {
  type Appointment,
  type AppointmentStatus,
  type Service,
  type Employee,
  type Client,
  DEMO_APPOINTMENTS,
  DEMO_SERVICES,
  DEMO_EMPLOYEES,
  DEMO_CLIENTS,
} from "@/lib/demo"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

const BLOCK_TYPE_LABELS: Record<string, string> = {
  break: "Descanso",
  absence: "Ausencia",
  personal: "Personal",
  vacation: "Vacaciones",
}

// Ventana visible del board — alineada con la agenda de employee (8:00–20:00).
const DAY_START_MIN = 8 * 60
const DAY_END_MIN = 20 * 60

// Native select con la misma superficie del Input (patrón del AppointmentModal).
const SELECT_CLS =
  "flex h-12 w-full cursor-pointer rounded-lg border border-border bg-card px-4 text-[15px] text-foreground transition-colors duration-micro ease-orno focus-visible:outline-none focus-visible:ring-[3px] focus-visible:border-primary focus-visible:ring-accent"

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0]!
}

/** Postgres `time` llega como "HH:MM:SS"; la UI y los inputs usan "HH:MM". */
function hhmm(t: string) {
  return t.slice(0, 5)
}

function minToHHMM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`
}

/** ISO local naive — se interpreta en la tz del navegador, la misma del cfg. */
function localIso(date: string, time: string) {
  return `${date}T${hhmm(time)}:00`
}

function addMinutes(time: string, minutes: number) {
  const [h, m] = hhmm(time).split(":").map(Number)
  return minToHHMM(h! * 60 + (m ?? 0) + minutes)
}

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

interface ApiBlock {
  id: string
  barber_id: string
  block_date: string
  start_time: string
  end_time: string
  reason: string
  block_type: string
}

export default function AppointmentsPage() {
  const router = useRouter()
  const user = useRequireAuth(["admin"])
  const notify = useNotify()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [blocks, setBlocks] = useState<ApiBlock[]>([])

  // Filtros — compartidos por ambas vistas (la vista solo cambia la representación).
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "all">("all")
  const [filterDate, setFilterDate] = useState("")
  const [filterEmployeeId, setFilterEmployeeId] = useState("")
  const [filterEmployeeName, setFilterEmployeeName] = useState("")

  const [viewMode, setViewMode] = useState<"board" | "list">("board")
  const [boardDate, setBoardDate] = useState(() => new Date())
  const [nowIso, setNowIso] = useState(() => new Date().toISOString())

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const PAGE_SIZE = 25

  // Pre-fill filters from query params (e.g. coming from "Ver Agenda" in employees)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const employeeId = params.get("employeeId")
    if (employeeId) {
      setFilterEmployeeId(employeeId)
      return
    }
    const q = params.get("q")
    if (q) setSearchTerm(q)
  }, [])

  // Línea de "ahora" — tick por minuto.
  useEffect(() => {
    const t = setInterval(() => setNowIso(new Date().toISOString()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Load appointments from Supabase (or demo data) — misma query que siempre.
  useEffect(() => {
    if (!supabase) {
      setAppointments(DEMO_APPOINTMENTS)
      setServices(DEMO_SERVICES)
      setEmployees(DEMO_EMPLOYEES)
      setClients(DEMO_CLIENTS.map((c) => ({ ...c, email: c.email ?? "" })))
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
          setAppointments(
            (data as unknown as AppointmentRow[]).map((raw) => {
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
                time: hhmm(raw.appointment_time),
                duration: service?.duration || 0,
                price: service?.price || 0,
                status: raw.status,
                notes: raw.notes || undefined,
                createdAt: raw.created_at,
              }
            })
          )
        }
        setIsLoading(false)
      })

    // Cargar datos del modal vía API (service_role para evitar RLS)
    fetch("/api/appointments/form-data")
      .then((r) => r.json())
      .then(({ clients, employees, services }) => {
        if (services)
          setServices(
            services.map((s: { id: string; name: string; price: number; duration: number }) => ({
              id: s.id,
              name: s.name,
              price: s.price,
              duration: s.duration,
            }))
          )
        if (employees)
          setEmployees(
            employees.map((e: { id: string; name: string; phone: string | null }) => ({
              id: e.id,
              name: e.name,
              email: "",
              phone: e.phone || "",
              role: "employee" as const,
            }))
          )
        if (clients)
          setClients(
            clients.map((c: { id: string; name: string; phone: string | null }) => ({
              id: c.id,
              name: c.name,
              email: "",
              phone: c.phone || "",
            }))
          )
      })
      .catch(console.error)
  }, [])

  const boardDateStr = toDateStr(boardDate)
  const todayStr = toDateStr(new Date())

  // Bloqueos del día del board — misma API por barbero que usa employee/schedule.
  useEffect(() => {
    if (employees.length === 0) {
      setBlocks([])
      return
    }
    let cancelled = false
    Promise.all(
      employees.map((e) =>
        fetch(`/api/schedule-blocks?barber_id=${e.id}&date=${boardDateStr}`)
          .then((r) => (r.ok ? (r.json() as Promise<{ blocks: ApiBlock[] }>) : { blocks: [] }))
          .catch(() => ({ blocks: [] as ApiBlock[] }))
      )
    ).then((results) => {
      if (!cancelled) setBlocks(results.flatMap((r) => r.blocks ?? []))
    })
    return () => {
      cancelled = true
    }
  }, [employees, boardDateStr])

  // Filter appointments — lógica compartida por Board y Lista.
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesEmployee = !filterEmployeeId || apt.employeeId === filterEmployeeId

      const matchesSearch =
        !searchTerm ||
        apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.serviceName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === "all" || apt.status === filterStatus
      const matchesDate = !filterDate || apt.date === filterDate

      return matchesEmployee && matchesSearch && matchesStatus && matchesDate
    })
  }, [appointments, searchTerm, filterStatus, filterDate, filterEmployeeId])

  useEffect(() => {
    if (!filterEmployeeId) {
      setFilterEmployeeName("")
      return
    }
    const fromCatalog = employees.find((e) => e.id === filterEmployeeId)
    const fromAppointments = appointments.find((apt) => apt.employeeId === filterEmployeeId)
    setFilterEmployeeName(fromCatalog?.name ?? fromAppointments?.employeeName ?? "")
  }, [filterEmployeeId, employees, appointments])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [searchTerm, filterStatus, filterDate])

  const totalPages = Math.ceil(filteredAppointments.length / PAGE_SIZE)
  const pagedAppointments = filteredAppointments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    const todayAppointments = appointments.filter((apt) => apt.date === today)

    return {
      total: appointments.length,
      today: todayAppointments.length,
      pending: appointments.filter((apt) => apt.status === "pending").length,
      confirmed: appointments.filter((apt) => apt.status === "confirmed").length,
    }
  }, [appointments])

  /* ── Board: mapeo al dominio del Scheduling Kit ────────────────────────── */

  const cfg = useMemo<Partial<ScheduleConfig>>(
    () => ({
      // La DB guarda fecha+hora naive (sin tz): interpretamos en la tz del
      // navegador para que el round-trip sea identidad.
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dayStartMin: DAY_START_MIN,
      dayEndMin: DAY_END_MIN,
      snapMinutes: 15,
      pxPerMinute: 1.2,
    }),
    []
  )

  const boardDayAppointments = useMemo(
    () => filteredAppointments.filter((a) => a.date === boardDateStr),
    [filteredAppointments, boardDateStr]
  )

  const resources = useMemo<SchedResource[]>(() => {
    const base = filterEmployeeId ? employees.filter((e) => e.id === filterEmployeeId) : employees
    const list: SchedResource[] = base.map((e) => ({ id: e.id, locationId: "default", name: e.name }))
    // Barberos con citas ese día que no estén en el catálogo (p. ej. dados de baja)
    for (const apt of boardDayAppointments) {
      if (apt.employeeId && !list.some((r) => r.id === apt.employeeId)) {
        list.push({ id: apt.employeeId, locationId: "default", name: apt.employeeName || "Sin asignar" })
      }
    }
    return list
  }, [employees, filterEmployeeId, boardDayAppointments])

  const schedAppointments = useMemo<SchedAppointment[]>(
    () =>
      boardDayAppointments.map((apt) => ({
        id: apt.id,
        locationId: "default",
        resourceId: apt.employeeId,
        clientId: apt.clientId,
        clientName: apt.clientName,
        serviceName: apt.serviceName,
        startsAt: localIso(apt.date, apt.time),
        endsAt: localIso(apt.date, addMinutes(apt.time, apt.duration || 30)),
        state: apt.status, // los 5 estados del repo son subconjunto de los 7 del kit
        note: apt.notes,
      })),
    [boardDayAppointments]
  )

  const schedBlocks = useMemo<SchedBlock[]>(
    () =>
      blocks
        .filter((b) => b.block_date === boardDateStr)
        .map((b) => ({
          id: b.id,
          resourceId: b.barber_id,
          locationId: "default",
          startsAt: localIso(b.block_date, b.start_time),
          endsAt: localIso(b.block_date, b.end_time),
          label: b.reason || BLOCK_TYPE_LABELS[b.block_type] || "Bloqueo",
        })),
    [blocks, boardDateStr]
  )

  const gapServices = useMemo(
    () => services.map((s) => ({ name: s.name, minutes: s.duration || 30 })),
    [services]
  )

  const boardLabel = useMemo(
    () =>
      boardDate.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    [boardDate]
  )

  /* ── Handlers CRUD — preservados de la página anterior ─────────────────── */

  const handleCreateAppointment = async (appointment: Omit<Appointment, "id" | "createdAt">) => {
    // Demo mode: crear cita local
    if (!supabase) {
      const newAppt: Appointment = {
        ...appointment,
        id: `demo-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      setAppointments((prev) => [newAppt, ...prev])
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
      setClients((prev) => [
        ...prev,
        { id: clientId, name: appointment.clientName, phone: appointment.clientPhone, email: json.client.email || "" },
      ])
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
      setAppointments((prev) => [
        { ...appointment, clientId, id: json.appointment.id, createdAt: json.appointment.created_at },
        ...prev,
      ])
    }
    setIsCreateModalOpen(false)
  }

  const handleUpdateAppointment = async (appointment: Appointment | Omit<Appointment, "id" | "createdAt">) => {
    const updatedAppointment = appointment as Appointment
    if (!supabase) {
      setAppointments((prev) => prev.map((apt) => (apt.id === updatedAppointment.id ? updatedAppointment : apt)))
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
      setAppointments((prev) => prev.map((apt) => (apt.id === updatedAppointment.id ? updatedAppointment : apt)))
    }
    setEditingAppointment(null)
  }

  const handleDeleteAppointment = async (id: string) => {
    if (!supabase) {
      setAppointments((prev) => prev.filter((apt) => apt.id !== id))
      setDeletingAppointment(null)
      return
    }
    const { error } = await supabase.from("appointments").delete().eq("id", id)
    if (!error) setAppointments((prev) => prev.filter((apt) => apt.id !== id))
    setDeletingAppointment(null)
  }

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    if (!supabase) {
      setAppointments((prev) => prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt)))
      setActiveDropdown(null)
      return
    }

    const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", id)

    if (!error) {
      setAppointments((prev) => prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt)))
    } else {
      const { data: fresh } = await supabase.from("appointments").select("status").eq("id", id).single()

      if (fresh) {
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === id ? { ...apt, status: fresh.status as AppointmentStatus } : apt))
        )
        console.warn(
          `No se pudo cambiar el estado. La cita ya fue marcada como "${fresh.status}" y el listado fue actualizado.`
        )
      }
    }
    setActiveDropdown(null)
  }

  /* ── Board: mover (drag / ⇧-flechas) — optimista + Deshacer ────────────── */

  const handleMove = useCallback(
    async (change: { appointmentId: string; resourceId: string; startMin: number; endMin: number; duplicate: boolean }) => {
      const appt = appointments.find((a) => a.id === change.appointmentId)
      if (!appt) return

      const newTime = minToHHMM(change.startMin)
      const newEmployeeName =
        employees.find((e) => e.id === change.resourceId)?.name ??
        resources.find((r) => r.id === change.resourceId)?.name ??
        appt.employeeName

      // ⌥-duplicar: crea una cita nueva por el MISMO camino que "Nueva Cita".
      if (change.duplicate) {
        const { id: _id, createdAt: _createdAt, ...rest } = appt
        await handleCreateAppointment({
          ...rest,
          employeeId: change.resourceId,
          employeeName: newEmployeeName,
          date: boardDateStr,
          time: newTime,
          status: "pending", // una cita duplicada es una reserva nueva
        })
        notify({ title: `Cita de ${appt.clientName} duplicada a las ${newTime} con ${newEmployeeName}.` })
        return
      }

      const prev = {
        date: appt.date,
        time: appt.time,
        employeeId: appt.employeeId,
        employeeName: appt.employeeName,
      }
      const apply = (patch: typeof prev) =>
        setAppointments((list) => list.map((a) => (a.id === change.appointmentId ? { ...a, ...patch } : a)))
      const next = { date: boardDateStr, time: newTime, employeeId: change.resourceId, employeeName: newEmployeeName }

      // Optimista: la UI se mueve ya; reconciliamos detrás.
      apply(next)

      const title = `Cita de ${appt.clientName} movida a las ${newTime} con ${newEmployeeName}.`

      if (!supabase) {
        notify({ title, onUndo: () => apply(prev) })
        return
      }

      // Misma tabla, misma mutación y mismo modelo RLS que handleUpdateAppointment.
      const { error } = await supabase
        .from("appointments")
        .update({
          barber_id: change.resourceId,
          appointment_date: boardDateStr,
          appointment_time: newTime,
        })
        .eq("id", change.appointmentId)

      if (error) {
        apply(prev)
        notify({ kind: "error", title: "No pudimos mover la cita.", description: "Quedó en su horario original." })
        return
      }

      notify({
        title,
        onUndo: () => {
          apply(prev)
          void supabase
            .from("appointments")
            .update({
              barber_id: prev.employeeId,
              appointment_date: prev.date,
              appointment_time: prev.time,
            })
            .eq("id", change.appointmentId)
        },
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appointments, employees, resources, boardDateStr, notify]
  )

  const handleSelectFromBoard = useCallback(
    (item: SchedAppointment) => {
      const appt = appointments.find((a) => a.id === item.id)
      if (appt) setEditingAppointment(appt)
    },
    [appointments]
  )

  if (!user) return null

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Agenda</h1>
          <p className="mt-1 text-[13px] text-ink-600">Administra todas las citas de la barbería</p>
          {filterEmployeeId && (
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex h-6 items-center rounded-full bg-accent px-2.5 text-xs font-semibold text-accent-foreground">
                Agenda de {filterEmployeeName || "empleado"}
              </span>
              <button
                type="button"
                onClick={() => setFilterEmployeeId("")}
                className="text-xs text-ink-600 underline underline-offset-2 hover:text-foreground"
              >
                Quitar filtro
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border border-border" role="group" aria-label="Modo de vista">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              title="Vista día (board)"
              aria-pressed={viewMode === "board"}
              className={`flex h-10 items-center gap-1.5 px-3 text-[13px] font-semibold transition-colors duration-micro ${
                viewMode === "board" ? "bg-primary text-primary-foreground" : "bg-card text-ink-600 hover:bg-secondary"
              }`}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              Día
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Vista lista"
              aria-pressed={viewMode === "list"}
              className={`flex h-10 items-center gap-1.5 px-3 text-[13px] font-semibold transition-colors duration-micro ${
                viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-ink-600 hover:bg-secondary"
              }`}
            >
              <List className="size-4" aria-hidden="true" />
              Lista
            </button>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="size-4" aria-hidden="true" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <StatStrip>
        <StatCard label="Total citas" value={stats.total} loading={isLoading} />
        <StatCard label="Hoy" value={stats.today} loading={isLoading} />
        <StatCard label="Pendientes" value={stats.pending} loading={isLoading} />
        <StatCard label="Confirmadas" value={stats.confirmed} loading={isLoading} />
      </StatStrip>

      {/* Filtros compartidos */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={searchTerm}
          onValueChange={setSearchTerm}
          placeholder="Buscar por cliente, empleado o servicio…"
          className="w-full sm:w-80"
        />
        <select
          aria-label="Filtrar por estado"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | "all")}
          className={`${SELECT_CLS} h-12 w-auto`}
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        {viewMode === "list" && (
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            aria-label="Filtrar por fecha"
            className="w-auto"
          />
        )}
      </div>

      {viewMode === "board" ? (
        <>
          {/* Navegación del día */}
          <div className="flex items-center justify-between rounded-[14px] border border-border bg-card px-4 py-2.5">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-md"
                aria-label="Día anterior"
                onClick={() => {
                  const d = new Date(boardDate)
                  d.setDate(d.getDate() - 1)
                  setBoardDate(d)
                }}
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon-md"
                aria-label="Día siguiente"
                onClick={() => {
                  const d = new Date(boardDate)
                  d.setDate(d.getDate() + 1)
                  setBoardDate(d)
                }}
              >
                <ChevronRight aria-hidden="true" />
              </Button>
              {boardDateStr !== todayStr && (
                <Button variant="secondary" size="sm" onClick={() => setBoardDate(new Date())}>
                  Hoy
                </Button>
              )}
            </div>
            <span className="text-[14.5px] font-semibold capitalize text-foreground">{boardLabel}</span>
            <span className="nums hidden text-xs text-ink-600 sm:block">
              {boardDayAppointments.length} {boardDayAppointments.length === 1 ? "cita" : "citas"}
            </span>
          </div>

          {/* Board M4 */}
          <div className="overflow-x-auto rounded-card border border-border bg-card">
            <AppointmentTimeline
              variant="board"
              cfg={cfg}
              resources={resources}
              appointments={schedAppointments}
              blocks={schedBlocks}
              nowIso={boardDateStr === todayStr ? nowIso : undefined}
              state={isLoading ? "loading" : "success"}
              services={gapServices}
              onMove={handleMove}
              allowResize={false}
              onSelect={handleSelectFromBoard}
              onCreateAt={() => setIsCreateModalOpen(true)}
              onBookGap={() => setIsCreateModalOpen(true)}
              selectedId={editingAppointment?.id ?? null}
            />
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Citas ({filteredAppointments.length})
              {totalPages > 1 && (
                <span className="ml-2 text-sm font-normal text-ink-600">
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
                <div className="space-y-3" role="status" aria-label="Cargando citas">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-[14px] bg-secondary" />
                  ))}
                </div>
              ) : filteredAppointments.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No se encontraron citas"
                  description="Ajusta los filtros o crea una cita nueva."
                  action={
                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                      <Plus className="size-4" aria-hidden="true" />
                      Nueva Cita
                    </Button>
                  }
                  size="compact"
                />
              ) : (
                <>
                  {pagedAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-[14px] border border-border bg-card p-4 transition-colors duration-micro hover:bg-secondary/60"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={appointment.status} />
                            <span className="hidden text-sm text-ink-600 sm:inline">
                              {new Date(appointment.date).toLocaleDateString("es-ES", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                            <span className="text-sm text-ink-600 sm:hidden">
                              {new Date(appointment.date).toLocaleDateString("es-ES", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="flex items-start gap-2">
                              <User className="mt-0.5 size-4 text-ink-400" aria-hidden="true" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{appointment.clientName}</p>
                                <p className="text-xs text-ink-600">{appointment.clientPhone}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Scissors className="mt-0.5 size-4 text-ink-400" aria-hidden="true" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{appointment.serviceName}</p>
                                <p className="text-xs text-ink-600">
                                  {appointment.duration} min · ${appointment.price}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Clock className="mt-0.5 size-4 text-ink-400" aria-hidden="true" />
                              <div>
                                <p className="nums text-sm font-medium text-foreground">{appointment.time}</p>
                                <p className="text-xs text-ink-600">{appointment.employeeName}</p>
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          {appointment.notes && (
                            <div className="rounded-lg bg-secondary p-2">
                              <p className="text-sm text-ink-600">
                                <span className="font-medium text-foreground">Notas:</span> {appointment.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="relative ml-4">
                          <Button
                            variant="ghost"
                            size="icon-md"
                            aria-label="Acciones de la cita"
                            onClick={() => setActiveDropdown(activeDropdown === appointment.id ? null : appointment.id)}
                          >
                            <MoreVertical aria-hidden="true" />
                          </Button>

                          {activeDropdown === appointment.id && (
                            <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-border bg-card py-1 shadow-overlay">
                              <button
                                onClick={() => {
                                  setEditingAppointment(appointment)
                                  setActiveDropdown(null)
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors duration-micro hover:bg-secondary"
                              >
                                <Edit className="size-4" aria-hidden="true" />
                                Editar
                              </button>

                              {appointment.status === "pending" && (
                                <button
                                  onClick={() => handleStatusChange(appointment.id, "confirmed")}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors duration-micro hover:bg-secondary"
                                >
                                  <CheckCircle className="size-4 text-success" aria-hidden="true" />
                                  Confirmar
                                </button>
                              )}

                              {appointment.status === "confirmed" && (
                                <button
                                  onClick={() => handleStatusChange(appointment.id, "completed")}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors duration-micro hover:bg-secondary"
                                >
                                  <CheckCircle className="size-4 text-dustyblue-text" aria-hidden="true" />
                                  Marcar como completada
                                </button>
                              )}

                              {(appointment.status === "confirmed" || appointment.status === "completed") && (
                                <button
                                  onClick={() => {
                                    setActiveDropdown(null)
                                    router.push(`/admin/pos?appointment_id=${appointment.id}`)
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-dustyblue-text transition-colors duration-micro hover:bg-secondary"
                                >
                                  <ShoppingCart className="size-4" aria-hidden="true" />
                                  Cobrar en POS
                                </button>
                              )}

                              {appointment.status === "confirmed" && (
                                <button
                                  onClick={() => {
                                    handleStatusChange(appointment.id, "no_show")
                                    setActiveDropdown(null)
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-warning-text transition-colors duration-micro hover:bg-secondary"
                                >
                                  <XCircle className="size-4" aria-hidden="true" />
                                  No se presentó
                                </button>
                              )}

                              {(appointment.status === "pending" || appointment.status === "confirmed") && (
                                <button
                                  onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink-600 transition-colors duration-micro hover:bg-secondary"
                                >
                                  <XCircle className="size-4 text-danger" aria-hidden="true" />
                                  Cancelar
                                </button>
                              )}

                              <div className="my-1 h-px bg-border" role="separator" />

                              <button
                                onClick={() => {
                                  setDeletingAppointment(appointment)
                                  setActiveDropdown(null)
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-danger-text transition-colors duration-micro hover:bg-danger-tint"
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <span className="nums text-sm text-ink-600">
                        {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredAppointments.length)} de{" "}
                        {filteredAppointments.length}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                          ← Anterior
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={page >= totalPages - 1}
                          onClick={() => setPage((p) => p + 1)}
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
        <ConfirmDialog
          open={!!deletingAppointment}
          onOpenChange={(open) => {
            if (!open) setDeletingAppointment(null)
          }}
          title="¿Eliminar esta cita?"
          description={
            <>
              {`${deletingAppointment.clientName} - ${deletingAppointment.serviceName}`}. Esta acción no se puede
              deshacer y el horario quedará libre.
            </>
          }
          confirmLabel="Sí, eliminar"
          cancelLabel="Mantener cita"
          tone="danger"
          onConfirm={() => handleDeleteAppointment(deletingAppointment.id)}
        />
      )}
    </div>
  )
}
