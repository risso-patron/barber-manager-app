"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { type Appointment } from "@/lib/demo-appointments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  AlertCircle,
  Plus,
  Trash2,
  Ban,
} from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

const HOUR_START = 8
const HOUR_END   = 20
const TOTAL_MINS = (HOUR_END - HOUR_START) * 60
const PX_PER_MIN = 2

type ScheduleBlock = {
  id: string
  barber_id: string
  block_date: string
  start_time: string
  end_time: string
  reason: string
  block_type: "break" | "absence" | "personal" | "vacation"
}

function timeToMins(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + (m ?? 0)
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

function toDateStr(d: Date) { return d.toISOString().split("T")[0] }

const BLOCK_TYPE_LABELS: Record<string, string> = {
  break: "Descanso",
  absence: "Ausencia",
  personal: "Personal",
  vacation: "Vacaciones",
}

const BLOCK_TYPE_COLORS: Record<string, string> = {
  break: "bg-yellow-100 border-yellow-400 text-yellow-800",
  absence: "bg-red-100 border-red-400 text-red-800",
  personal: "bg-purple-100 border-purple-400 text-purple-800",
  vacation: "bg-blue-100 border-blue-400 text-blue-800",
}

export default function EmployeeSchedulePage() {
  const user = useRequireAuth(["employee", "admin", "manager"])
  const [activeTab, setActiveTab] = useState<"day" | "week" | "blocks">("day")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])

  const [blockDate, setBlockDate] = useState(new Date().toISOString().split("T")[0])
  const [blockStart, setBlockStart] = useState("12:00")
  const [blockEnd, setBlockEnd] = useState("13:00")
  const [blockReason, setBlockReason] = useState("")
  const [blockType, setBlockType] = useState<"break" | "absence" | "personal" | "vacation">("break")
  const [blockSaving, setBlockSaving] = useState(false)
  const [blockError, setBlockError] = useState("")

  useEffect(() => {
    if (!user || !supabase) return
    supabase
      .from("appointments")
      .select(`id, appointment_date, appointment_time, status, notes, created_at,
        client:users!appointments_client_id_fkey(id, name, phone),
        service:services(id, name, price, duration)`)
      .eq("barber_id", user.id)
      .order("appointment_date")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }) => {
        if (data) setAppointments(
          (data as any[]).map(a => ({
            id: a.id,
            clientId: a.client?.id || "",
            clientName: a.client?.name || "",
            clientPhone: a.client?.phone || "",
            employeeId: user.id,
            employeeName: (user as { name?: string }).name ?? "",
            serviceId: a.service?.id || "",
            serviceName: a.service?.name || "",
            date: a.appointment_date,
            time: a.appointment_time,
            duration: a.service?.duration || 30,
            price: a.service?.price || 0,
            status: a.status,
            notes: a.notes || "",
            createdAt: a.created_at,
          })))
      })
  }, [user])

  const loadBlocks = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/schedule-blocks?barber_id=${user.id}`)
      if (res.ok) {
        const json = await res.json() as { blocks: ScheduleBlock[] }
        setBlocks(json.blocks)
      }
    } catch { /* ignore */ }
  }, [user])

  useEffect(() => { void loadBlocks() }, [loadBlocks])

  const formattedDate = toDateStr(selectedDate)
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])
  const today = toDateStr(new Date())
  const isToday = formattedDate === today

  const dayAppointments = useMemo(() =>
    appointments.filter(a => a.date === formattedDate).sort((a, b) => a.time.localeCompare(b.time))
  , [appointments, formattedDate])

  const stats = useMemo(() => ({
    total:     dayAppointments.length,
    confirmed: dayAppointments.filter(a => a.status === "confirmed").length,
    completed: dayAppointments.filter(a => a.status === "completed").length,
    revenue:   dayAppointments.filter(a => a.status === "completed").reduce((s, a) => s + a.price, 0),
  }), [dayAppointments])

  const getStatusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-green-100 text-green-800 border-green-300"
      case "confirmed": return "bg-blue-100 text-blue-800 border-blue-300"
      case "pending":   return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "cancelled": return "bg-red-100 text-red-800 border-red-300"
      case "no_show":   return "bg-orange-100 text-orange-800 border-orange-300"
      default:          return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }
  const getStatusIcon = (s: string) => {
    switch (s) {
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "pending":   return <AlertCircle className="h-4 w-4" />
      case "cancelled": return <XCircle className="h-4 w-4" />
      default:          return <Clock className="h-4 w-4" />
    }
  }
  const getStatusLabel = (s: string) => ({
    completed: "Completada", confirmed: "Confirmada", pending: "Pendiente",
    cancelled: "Cancelada", no_show: "No se presentó",
  }[s] ?? s)

  const handleSaveBlock = async () => {
    setBlockError("")
    if (!blockDate || !blockStart || !blockEnd) {
      setBlockError("Completa todos los campos"); return
    }
    if (blockStart >= blockEnd) {
      setBlockError("La hora de fin debe ser posterior a la de inicio"); return
    }
    setBlockSaving(true)
    try {
      const res = await fetch("/api/schedule-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block_date: blockDate,
          start_time: blockStart,
          end_time:   blockEnd,
          reason:     blockReason || BLOCK_TYPE_LABELS[blockType],
          block_type: blockType,
        }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        setBlockError(err.error ?? "Error al guardar")
      } else {
        setBlockReason("")
        await loadBlocks()
      }
    } catch {
      setBlockError("Error de conexión")
    } finally {
      setBlockSaving(false)
    }
  }

  const handleDeleteBlock = async (id: string) => {
    try {
      await fetch(`/api/schedule-blocks?id=${id}`, { method: "DELETE" })
      setBlocks(prev => prev.filter(b => b.id !== id))
    } catch { /* ignore */ }
  }

  const hourLabels = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  const renderCalendarGrid = () => (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b">
          <div />
          {weekDays.map((d) => {
            const ds = toDateStr(d)
            const isSelected = ds === formattedDate
            const isTodayDay  = ds === today
            return (
              <div
                key={ds}
                onClick={() => { setSelectedDate(d); setActiveTab("day") }}
                className={`text-center py-2 text-sm font-medium cursor-pointer border-l select-none
                  ${isSelected ? "bg-blue-50 text-blue-700" : ""}
                  ${isTodayDay && !isSelected ? "font-bold" : ""}
                  hover:bg-gray-50`}
              >
                <div>{d.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase()}</div>
                <div className={`text-xs mt-0.5 ${isTodayDay ? "text-blue-600 font-bold" : "text-muted-foreground"}`}>
                  {d.getDate()} {d.toLocaleDateString("es-ES", { month: "short" })}
                </div>
              </div>
            )
          })}
        </div>
        <div className="relative" style={{ height: `${TOTAL_MINS * PX_PER_MIN}px` }}>
          {hourLabels.map((h) => (
            <div
              key={h}
              className="absolute w-full border-t border-gray-100 flex"
              style={{ top: `${(h - HOUR_START) * 60 * PX_PER_MIN}px` }}
            >
              <div className="w-16 -translate-y-2.5 text-right pr-2 text-xs text-muted-foreground select-none">
                {String(h).padStart(2, "0")}:00
              </div>
              <div className="flex-1 border-l border-gray-100" />
            </div>
          ))}
          <div className="absolute inset-0 grid grid-cols-[64px_repeat(7,1fr)]">
            <div />
            {weekDays.map((d) => {
              const ds = toDateStr(d)
              const dayApts   = appointments.filter(a => a.date === ds)
              const dayBlocks = blocks.filter(b => b.block_date === ds)
              return (
                <div key={ds} className="relative border-l border-gray-100">
                  {dayApts.map((apt) => {
                    const startMins = timeToMins(apt.time) - HOUR_START * 60
                    const duration  = Math.max(apt.duration, 15)
                    if (startMins < 0 || startMins >= TOTAL_MINS) return null
                    const top    = startMins * PX_PER_MIN
                    const height = Math.min(duration * PX_PER_MIN, (TOTAL_MINS - startMins) * PX_PER_MIN)
                    const colorMap: Record<string, string> = {
                      completed: "bg-green-200 border-green-500",
                      confirmed: "bg-blue-200 border-blue-500",
                      pending:   "bg-yellow-200 border-yellow-500",
                      cancelled: "bg-red-100 border-red-400 opacity-50",
                      no_show:   "bg-orange-200 border-orange-500",
                    }
                    const color = colorMap[apt.status] ?? "bg-gray-200 border-gray-400"
                    return (
                      <div
                        key={apt.id}
                        title={`${apt.time} — ${apt.serviceName} (${apt.clientName})`}
                        className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1 overflow-hidden cursor-default ${color}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <p className="text-[10px] font-semibold leading-tight truncate">{apt.time}</p>
                        <p className="text-[10px] leading-tight truncate">{apt.clientName}</p>
                      </div>
                    )
                  })}
                  {dayBlocks.map((blk) => {
                    const startMins = timeToMins(blk.start_time) - HOUR_START * 60
                    const endMins   = timeToMins(blk.end_time) - HOUR_START * 60
                    if (startMins < 0 || startMins >= TOTAL_MINS) return null
                    const top    = startMins * PX_PER_MIN
                    const height = Math.min((endMins - startMins) * PX_PER_MIN, (TOTAL_MINS - startMins) * PX_PER_MIN)
                    return (
                      <div
                        key={blk.id}
                        title={`${blk.start_time}–${blk.end_time}: ${blk.reason}`}
                        className="absolute left-0.5 right-0.5 rounded border-l-2 px-1 overflow-hidden cursor-default bg-gray-200 border-gray-500 opacity-70"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <p className="text-[10px] font-semibold leading-tight truncate">{blk.start_time}</p>
                        <p className="text-[10px] leading-tight truncate">{BLOCK_TYPE_LABELS[blk.block_type]}</p>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  if (!user) return null

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mi Agenda</h1>
        <p className="text-muted-foreground">Gestiona tus citas y bloqueos de horario</p>
      </div>

      {/* Navegación de fecha */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => {
              const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d)
            }}>
              <ChevronLeft className="h-4 w-4 mr-2" />Anterior
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-bold">
                {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </h2>
              {!isToday && (
                <Button variant="link" onClick={() => setSelectedDate(new Date())} className="mt-1 text-sm">
                  Ir a hoy
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => {
              const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d)
            }}>
              Siguiente<ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {(["day", "week", "blocks"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "day" ? "Día" : tab === "week" ? "Calendario semanal" : "Bloqueos"}
          </button>
        ))}
      </div>

      {/* ── TAB: DÍA ─────────────────────────────────────────────── */}
      {activeTab === "day" && (
        <>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Citas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-600">{stats.completed}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-600">${stats.revenue}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Horario del Día</CardTitle>
              <CardDescription>
                {dayAppointments.length} cita{dayAppointments.length !== 1 ? "s" : ""} programada{dayAppointments.length !== 1 ? "s" : ""}
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
                    <div key={apt.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 text-center min-w-[80px]">
                          <div className="text-2xl font-bold">{apt.time}</div>
                          <div className="text-xs text-muted-foreground">{apt.duration} min</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-lg">{apt.serviceName}</h4>
                            <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(apt.status)}`}>
                              {getStatusIcon(apt.status)}
                              {getStatusLabel(apt.status)}
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
        </>
      )}

      {/* ── TAB: CALENDARIO SEMANAL ───────────────────────────────── */}
      {activeTab === "week" && (
        <Card>
          <CardHeader>
            <CardTitle>Calendario Semanal</CardTitle>
            <CardDescription>
              Semana del {weekDays[0]?.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
              {" "}al {weekDays[6]?.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              {" · "}Haz clic en un día para ver el detalle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 border-l-2 border-blue-500 inline-block" />Confirmada</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 border-l-2 border-green-500 inline-block" />Completada</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200 border-l-2 border-yellow-500 inline-block" />Pendiente</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-200 border-l-2 border-orange-500 inline-block" />No se presentó</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 border-l-2 border-gray-500 inline-block" />Bloqueo</span>
            </div>
            <div className="rounded-lg border overflow-hidden">
              {renderCalendarGrid()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB: BLOQUEOS ────────────────────────────────────────────── */}
      {activeTab === "blocks" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-orange-600" />
                Nuevo bloqueo
              </CardTitle>
              <CardDescription>Registra un descanso, ausencia o bloqueo de horario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="block-date">Fecha</Label>
                  <Input
                    id="block-date"
                    type="date"
                    value={blockDate}
                    onChange={e => setBlockDate(e.target.value)}
                    min={today}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-type">Tipo</Label>
                  <Select value={blockType} onValueChange={v => setBlockType(v as typeof blockType)}>
                    <SelectTrigger id="block-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="break">Descanso</SelectItem>
                      <SelectItem value="absence">Ausencia</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="vacation">Vacaciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="block-start">Hora inicio</Label>
                  <Input id="block-start" type="time" value={blockStart} onChange={e => setBlockStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-end">Hora fin</Label>
                  <Input id="block-end" type="time" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-reason">Motivo (opcional)</Label>
                <Input
                  id="block-reason"
                  placeholder="Ej: Almuerzo, cita médica…"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  maxLength={200}
                />
              </div>
              {blockError && <p className="text-sm text-red-600">{blockError}</p>}
              <Button onClick={() => void handleSaveBlock()} disabled={blockSaving} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {blockSaving ? "Guardando…" : "Agregar bloqueo"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bloqueos registrados</CardTitle>
              <CardDescription>{blocks.length} bloqueo{blocks.length !== 1 ? "s" : ""} en total</CardDescription>
            </CardHeader>
            <CardContent>
              {blocks.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">Sin bloqueos registrados</p>
                  <p className="text-sm">Agrega uno para bloquear un tramo de tu horario</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {blocks
                    .sort((a, b) => a.block_date.localeCompare(b.block_date) || a.start_time.localeCompare(b.start_time))
                    .map(blk => (
                      <div
                        key={blk.id}
                        className={`flex items-start justify-between p-3 border rounded-lg ${BLOCK_TYPE_COLORS[blk.block_type] ?? ""}`}
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {new Date(blk.block_date + "T00:00:00").toLocaleDateString("es-ES", {
                              weekday: "short", day: "numeric", month: "short",
                            })}
                            {" · "}{blk.start_time}–{blk.end_time}
                          </div>
                          <div className="text-xs mt-0.5">
                            <span className="font-medium">{BLOCK_TYPE_LABELS[blk.block_type]}</span>
                            {blk.reason && blk.reason !== BLOCK_TYPE_LABELS[blk.block_type] && ` · ${blk.reason}`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          onClick={() => void handleDeleteBlock(blk.id)}
                          title="Eliminar bloqueo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}


