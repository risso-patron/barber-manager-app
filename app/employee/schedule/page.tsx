"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { type Appointment, type AppointmentStatus, getAppointmentsByEmployee, APPOINTMENT_STATUS_LABELS } from "@/lib/demo"
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
  return h! * 60 + (m ?? 0)
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
  break:    "bg-yellow-900/20 border-yellow-700 text-yellow-400",
  absence:  "bg-red-900/20 border-red-700/50 text-[#E53935]",
  personal: "bg-purple-900/20 border-purple-700 text-purple-400",
  vacation: "bg-blue-900/20 border-blue-700 text-blue-400",
}

export default function EmployeeSchedulePage() {
  const user = useRequireAuth(["employee", "admin"])
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
    if (!user) return
    if (!supabase) {
      setAppointments(getAppointmentsByEmployee(user.id))
      return
    }
    supabase
      .from("appointments")
      .select(`id, appointment_date, appointment_time, status, notes, created_at,
        client:users!appointments_client_id_fkey(id, name, phone),
        service:services(id, name, price, duration)`)
      .eq("barber_id", user.id)
      .order("appointment_date")
      .then(({ data }) => {
        if (data) setAppointments(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      case "no_show":   return <Ban className="h-4 w-4" />
      default:          return <Clock className="h-4 w-4" />
    }
  }

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
        <div className="grid grid-cols-[64px_repeat(7,1fr)]" style={{ borderBottom: "1px solid #252525" }}>
          <div />
          {weekDays.map((d) => {
            const ds = toDateStr(d)
            const isSelected = ds === formattedDate
            const isTodayDay  = ds === today
            return (
              <div
                key={ds}
                onClick={() => { setSelectedDate(d); setActiveTab("day") }}
                className="text-center py-2 cursor-pointer select-none transition-colors"
                style={{ borderLeft: "1px solid #252525", background: isSelected ? "#2E2E2E" : "transparent" }}
              >
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", color: isSelected ? "#E53935" : "#8A8A8A" }}>
                  {d.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase()}
                </div>
                <div style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", marginTop: "2px", color: isTodayDay ? "#E53935" : "#555555", fontWeight: isTodayDay ? 600 : 400 }}>
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
              className="absolute w-full flex"
              style={{ top: `${(h - HOUR_START) * 60 * PX_PER_MIN}px`, borderTop: "1px solid #252525" }}
            >
              <div className="w-16 -translate-y-2.5 text-right pr-2 select-none" style={{ fontFamily: "var(--font-dm-mono)", fontSize: "10px", color: "#555555" }}>
                {String(h).padStart(2, "0")}:00
              </div>
              <div className="flex-1" style={{ borderLeft: "1px solid #252525" }} />
            </div>
          ))}
          <div className="absolute inset-0 grid grid-cols-[64px_repeat(7,1fr)]">
            <div />
            {weekDays.map((d) => {
              const ds = toDateStr(d)
              const dayApts   = appointments.filter(a => a.date === ds)
              const dayBlocks = blocks.filter(b => b.block_date === ds)
              return (
                <div key={ds} className="relative" style={{ borderLeft: "1px solid #252525" }}>
                  {dayApts.map((apt) => {
                    const startMins = timeToMins(apt.time) - HOUR_START * 60
                    const duration  = Math.max(apt.duration, 15)
                    if (startMins < 0 || startMins >= TOTAL_MINS) return null
                    const top    = startMins * PX_PER_MIN
                    const height = Math.min(duration * PX_PER_MIN, (TOTAL_MINS - startMins) * PX_PER_MIN)
                    const colorMap: Record<string, string> = {
                      completed: "bg-green-900/40 border-green-600",
                      confirmed: "bg-blue-900/40 border-blue-600",
                      pending:   "bg-yellow-900/40 border-yellow-600",
                      cancelled: "bg-red-900/20 border-red-700 opacity-50",
                      no_show:   "bg-orange-900/40 border-orange-600",
                    }
                    const color = colorMap[apt.status] ?? "bg-[#252525] border-[#444]"
                    return (
                      <div
                        key={apt.id}
                        title={`${apt.time} — ${apt.serviceName} (${apt.clientName})`}
                        className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1 overflow-hidden cursor-default ${color}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <p className="text-[10px] font-semibold leading-tight truncate" style={{ color: "#F0F0F0" }}>{apt.time}</p>
                        <p className="text-[10px] leading-tight truncate" style={{ color: "#8A8A8A" }}>{apt.clientName}</p>
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
                        className="absolute left-0.5 right-0.5 rounded border-l-2 px-1 overflow-hidden cursor-default opacity-70"
                        style={{ top: `${top}px`, height: `${height}px`, background: "#252525", borderLeftColor: "#555555" }}
                      >
                        <p className="text-[10px] font-semibold leading-tight truncate" style={{ color: "#8A8A8A" }}>{blk.start_time}</p>
                        <p className="text-[10px] leading-tight truncate" style={{ color: "#555555" }}>{BLOCK_TYPE_LABELS[blk.block_type]}</p>
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
        .orno-btn { transition: background 0.15s, color 0.15s; }
        .orno-btn:hover { background: rgba(240,240,240,0.06) !important; }
      `}</style>

      {/* ── Header ── */}
      <div className="pt-8 pb-3">
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(28px,4vw,40px)", fontWeight: 300, color: "#F0F0F0", letterSpacing: "-0.02em" }}>Mi agenda</p>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>
          {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Date nav ── */}
      <div style={{ borderTop: "1px solid #252525", padding: "16px 0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          className="orno-btn"
          onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d) }}
          style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8A8A", background: "none", border: "1px solid #2E2E2E", padding: "8px 16px", cursor: "pointer" }}
        >← Anterior</button>
        {!isToday && (
          <button
            className="orno-btn"
            onClick={() => setSelectedDate(new Date())}
            style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#E53935", background: "none", border: "none", cursor: "pointer" }}
          >Ir a hoy</button>
        )}
        <button
          className="orno-btn"
          onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d) }}
          style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8A8A", background: "none", border: "1px solid #2E2E2E", padding: "8px 16px", cursor: "pointer" }}
        >Siguiente →</button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid #252525", marginBottom: "24px" }}>
        {(["day", "week", "blocks"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
              background: "none", border: "none", padding: "12px 0", cursor: "pointer",
              color: activeTab === tab ? "#F0F0F0" : "#555555",
              borderBottom: activeTab === tab ? "1px solid #E53935" : "1px solid transparent",
              marginBottom: "-1px", transition: "color 0.15s",
            }}
          >
            {tab === "day" ? "Día" : tab === "week" ? "Semana" : "Bloqueos"}
          </button>
        ))}
      </div>

      {/* ── TAB: DÍA ── */}
      {activeTab === "day" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderTop: "1px solid #252525", marginBottom: "32px" }}>
            {[
              { value: String(stats.total),     label: "Total citas" },
              { value: String(stats.confirmed), label: "Confirmadas" },
              { value: String(stats.completed), label: "Completadas" },
              { value: `$${stats.revenue}`,     label: "Ingresos" },
            ].map((s, i) => (
              <div key={i} className="orno-row" style={{ padding: "20px 0", borderRight: i < 3 ? "1px solid #252525" : "none", paddingLeft: i > 0 ? "20px" : 0, paddingRight: i < 3 ? "20px" : 0 }}>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(24px,3vw,36px)", fontWeight: 300, lineHeight: 1, color: "#F0F0F0" }}>{s.value}</p>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #252525" }}>
            {dayAppointments.length === 0 ? (
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 300, color: "#555555", padding: "24px 0" }}>Sin citas para este día</p>
            ) : (
              dayAppointments.map((apt, i) => (
                <div key={apt.id} className="orno-row" style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "flex-start", gap: "18px" }}>
                  <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "#555555", minWidth: "18px", paddingTop: "3px" }}>{String(i+1).padStart(2,"0")}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "19px", fontWeight: 400, color: "#F0F0F0" }}>
                        {apt.time} · {apt.serviceName}
                      </p>
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: apt.status === "confirmed" ? "#8A8A8A" : apt.status === "completed" ? "#22C55E" : apt.status === "cancelled" ? "#E53935" : "#F59E0B" }}>
                        {APPOINTMENT_STATUS_LABELS[apt.status as AppointmentStatus] ?? apt.status}
                      </span>
                    </div>
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginTop: "2px" }}>
                      {apt.clientName}{apt.clientPhone && ` · ${apt.clientPhone}`}{" · "}{apt.duration} min · ${apt.price}
                    </p>
                    {apt.notes && (
                      <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#555555", marginTop: "2px", fontStyle: "italic" }}>{apt.notes}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── TAB: SEMANA ── */}
      {activeTab === "week" && (
        <div style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #2E2E2E" }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 300, color: "#F0F0F0" }}>Calendario semanal</p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginTop: "2px" }}>
              {weekDays[0]?.toLocaleDateString("es-ES", { day: "numeric", month: "long" })} — {weekDays[6]?.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px" }}>
              {[
                { color: "bg-blue-900/40 border-blue-600",     label: "Confirmada" },
                { color: "bg-green-900/40 border-green-600",   label: "Completada" },
                { color: "bg-yellow-900/40 border-yellow-600", label: "Pendiente" },
                { color: "bg-orange-900/40 border-orange-600", label: "No se presentó" },
                { color: "bg-[#252525] border-[#555555]",      label: "Bloqueo" },
              ].map(l => (
                <span key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#8A8A8A" }}>
                  <span className={`w-3 h-3 rounded border-l-2 inline-block ${l.color}`} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ padding: "0 24px 24px" }}>
            {renderCalendarGrid()}
          </div>
        </div>
      )}

      {/* ── TAB: BLOQUEOS ── */}
      {activeTab === "blocks" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {!supabase && (
            <div className="lg:col-span-2" style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: "4px", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#111", background: "#8A8A8A", padding: "2px 6px", borderRadius: "2px", flexShrink: 0 }}>Demo</span>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A" }}>Los bloqueos se guardan en memoria y se pierden al reiniciar el servidor.</p>
            </div>
          )}
          <div style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: "8px", padding: "24px" }}>
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 300, color: "#F0F0F0" }}>Nuevo bloqueo</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginTop: "2px" }}>Registra un descanso, ausencia o bloqueo de horario</p>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="block-date" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A" }}>Fecha</Label>
                  <Input id="block-date" type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} min={today}
                    style={{ background: "#111", border: "1px solid #2E2E2E", color: "#F0F0F0", fontFamily: "var(--font-dm-sans)" }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-type" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A" }}>Tipo</Label>
                  <Select value={blockType} onValueChange={v => setBlockType(v as typeof blockType)}>
                    <SelectTrigger id="block-type" style={{ background: "#111", border: "1px solid #2E2E2E", color: "#F0F0F0" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: "#1A1A1A", border: "1px solid #2E2E2E" }}>
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
                  <Label htmlFor="block-start" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A" }}>Hora inicio</Label>
                  <Input id="block-start" type="time" value={blockStart} onChange={e => setBlockStart(e.target.value)}
                    style={{ background: "#111", border: "1px solid #2E2E2E", color: "#F0F0F0", fontFamily: "var(--font-dm-mono)" }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-end" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A" }}>Hora fin</Label>
                  <Input id="block-end" type="time" value={blockEnd} onChange={e => setBlockEnd(e.target.value)}
                    style={{ background: "#111", border: "1px solid #2E2E2E", color: "#F0F0F0", fontFamily: "var(--font-dm-mono)" }} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-reason" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A" }}>Motivo (opcional)</Label>
                <Input id="block-reason" placeholder="Ej: Almuerzo, cita médica…" value={blockReason} onChange={e => setBlockReason(e.target.value)} maxLength={200}
                  style={{ background: "#111", border: "1px solid #2E2E2E", color: "#F0F0F0", fontFamily: "var(--font-dm-sans)" }} />
              </div>
              {blockError && <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#E53935" }}>{blockError}</p>}
              <button
                className="orno-btn"
                onClick={() => void handleSaveBlock()}
                disabled={blockSaving}
                style={{ width: "100%", fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#F0F0F0", background: blockSaving ? "#2E2E2E" : "#E53935", border: "none", padding: "12px", cursor: blockSaving ? "default" : "pointer", borderRadius: "4px" }}
              >
                {blockSaving ? "Guardando…" : "+ Agregar bloqueo"}
              </button>
            </div>
          </div>

          <div style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: "8px", padding: "24px" }}>
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 300, color: "#F0F0F0" }}>Bloqueos registrados</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginTop: "2px" }}>{blocks.length} bloqueo{blocks.length !== 1 ? "s" : ""} en total</p>
            </div>
            {blocks.length === 0 ? (
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "18px", fontWeight: 300, color: "#555555", padding: "16px 0" }}>Sin bloqueos registrados</p>
            ) : (
              <div style={{ maxHeight: "480px", overflowY: "auto" }}>
                {blocks
                  .sort((a, b) => a.block_date.localeCompare(b.block_date) || a.start_time.localeCompare(b.start_time))
                  .map(blk => (
                    <div key={blk.id} className="orno-row"
                      style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <div>
                        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "17px", fontWeight: 400, color: "#F0F0F0" }}>
                          {new Date(blk.block_date + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                          {" · "}{blk.start_time}–{blk.end_time}
                        </p>
                        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#8A8A8A", marginTop: "2px", letterSpacing: "0.08em" }}>
                          {BLOCK_TYPE_LABELS[blk.block_type]}
                          {blk.reason && blk.reason !== BLOCK_TYPE_LABELS[blk.block_type] && ` · ${blk.reason}`}
                        </p>
                      </div>
                      <button
                        className="orno-btn"
                        onClick={() => void handleDeleteBlock(blk.id)}
                        title="Eliminar bloqueo"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#555555", padding: "4px", transition: "color 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#E53935")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#555555")}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


