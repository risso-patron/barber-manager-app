"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { type Appointment } from "@/lib/demo-appointments"
import { createBrowserClient } from "@supabase/ssr"
import { CheckCircle, Calendar, AlertCircle, XCircle, Clock } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

export default function EmployeeDashboard() {
  const router = useRouter()
  const user = useRequireAuth(["employee", "admin"])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [commissionRate, setCommissionRate] = useState<number | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [workStartTime, setWorkStartTime] = useState<string | null>(null)
  const [workEndTime, setWorkEndTime] = useState<string | null>(null)
  const [attendanceId, setAttendanceId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; createdAt: string }>>([])

  const loadAppointments = useCallback(async (employeeId: string, employeeName?: string) => {
    // Fetch appointments + commission_rate in parallel
    const [aptsResult, userResult] = await Promise.all([
      supabase!
        .from("appointments")
        .select(`id, appointment_date, appointment_time, status, notes, rating, feedback, commission_amount, created_at,
          client:users!appointments_client_id_fkey(id, name, phone),
          service:services(id, name, price, duration)`)
        .eq("barber_id", employeeId)
        .order("appointment_date", { ascending: false }),
      supabase!
        .from("users")
        .select("commission_rate")
        .eq("id", employeeId)
        .single(),
    ])

    if (userResult.data?.commission_rate != null) {
      setCommissionRate(userResult.data.commission_rate)
    }

    const data = aptsResult.data
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
        commission_amount: a.commission_amount ?? undefined,
        createdAt: a.created_at,
      })))
    }
  }, [])

  useEffect(() => {
    if (!user) return
    void loadAppointments(user.id, (user as { name?: string }).name)

    if (!supabase) return
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

      // Restore work session from database
      void fetch("/api/attendance")
        .then((r) => r.json())
        .then((session: { id?: string; check_in?: string } | null) => {
          if (session?.id && session?.check_in) {
            setAttendanceId(session.id)
            setIsWorking(true)
            setWorkStartTime(session.check_in)
          }
        })
        .catch(() => { /* non-critical */ })

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

    // Commission this calendar month
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const thisMonthCompleted = completed.filter(apt => apt.date.startsWith(monthStr))
    // Use stored commission_amount when available; fall back to live calculation
    const monthCommission = thisMonthCompleted.reduce((sum, apt) => {
      const stored = (apt as unknown as { commission_amount?: number }).commission_amount
      if (stored != null) return sum + stored
      if (commissionRate != null) return sum + apt.price * commissionRate
      return sum
    }, 0)

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
      monthCommission,
      commissionPct: commissionRate != null ? commissionRate * 100 : null,
    }
  }, [appointments, todayDate, commissionRate])

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

  const handleClockIn = async () => {
    try {
      const res = await fetch("/api/attendance", { method: "POST" })
      const data = (await res.json()) as { id?: string; check_in?: string }
      if (data.id && data.check_in) {
        setAttendanceId(data.id)
        setIsWorking(true)
        setWorkStartTime(data.check_in)
      }
    } catch {
      // Fallback: update UI optimistically
      setIsWorking(true)
      setWorkStartTime(new Date().toISOString())
    }
  }

  const handleClockOut = async () => {
    const now = new Date().toISOString()
    setIsWorking(false)
    setWorkEndTime(now)
    if (attendanceId) {
      try {
        await fetch(`/api/attendance/${attendanceId}`, { method: "PATCH" })
      } catch {
        // Non-critical: session is visually closed regardless
      }
      setAttendanceId(null)
    }
  }

  const handleCompleteAppointment = async (id: string) => {
    await supabase?.from("appointments").update({ status: "completed" }).eq("id", id)
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, status: "completed" as const } : apt
    ))
  }

  const handleCancelAppointment = async (id: string) => {
    await supabase?.from("appointments").update({ status: "cancelled" }).eq("id", id)
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

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/auth/login")
  }

  if (!user) return null

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf9", color: "#1a1a18" }}>
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
        .orno-btn:hover { background: rgba(26,26,24,0.06) !important; }
        .orno-complete:hover { color: rgba(26,26,24,0.9) !important; }
        .orno-cancel:hover { color: #cc2222 !important; }
        .orno-exit:hover { color: #cc2222 !important; }
        .orno-pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(26,26,24,0.12)" }}>
        <div className="max-w-5xl mx-auto px-8 pt-5 pb-0 flex items-center justify-between">
          <img src="/orno_logo.svg" alt="Ornō" style={{ height: "100px", width: "auto" }} />
          <div className="flex items-center gap-6">
            {isWorking && (
              <span className="orno-pulse" style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80" }} />
            )}
            {/* Nav por especialidad */}
            {(() => {
              const specialty = (user as { specialty?: string | null }).specialty
              const navItems: { label: string; href: string }[] = [
                { label: "Agenda", href: "/employee/schedule" },
                { label: "Horario", href: "/employee/time-tracking" },
              ]
              if (specialty === "barbero" || specialty === "gerente") {
                navItems.push({ label: "Estadísticas", href: "/employee/stats" })
              }
              if (specialty === "cajero" || specialty === "gerente") {
                navItems.push({ label: "Inventario", href: "/admin/inventory" })
              }
              if (specialty === "recepcionista" || specialty === "gerente") {
                navItems.push({ label: "Clientes", href: "/admin/clients" })
              }
              navItems.push({ label: "Perfil", href: "/employee/profile" })
              return navItems.map(item => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(26,26,24,0.55)", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", background: "none", border: "none", padding: 0, transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(26,26,24,0.9)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(26,26,24,0.55)")}
                >
                  {item.label}
                </button>
              ))
            })()}
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "rgba(26,26,24,0.50)", letterSpacing: "0.04em" }}>
              {(user as { name?: string }).name || user.email}
            </span>
            <button
              className="orno-exit"
              onClick={handleLogout}
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(26,26,24,0.38)", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", background: "none", border: "none", padding: 0, transition: "color 0.2s" }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8">


        {/* ── Jornada ──────────────────────── */}
        <div className="pt-8 pb-3">
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(26,26,24,0.45)" }}>Jornada</p>
        </div>
        <div style={{ borderTop: "1px solid rgba(26,26,24,0.12)", padding: "20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {isWorking ? (
            <div>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "28px", fontWeight: 300, color: "#1a1a18" }}>
                {getWorkDuration()}
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(26,26,24,0.45)", marginTop: "3px" }}>
                Inicio · {workStartTime && formatTime(workStartTime!)}
              </p>
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "22px", fontWeight: 300, color: "rgba(26,26,24,0.35)" }}>Sin jornada activa</p>
          )}
          <button
            className="orno-btn"
            onClick={isWorking ? handleClockOut : handleClockIn}
            style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: isWorking ? "#cc2222" : "rgba(26,26,24,0.65)", background: "none", border: "1px solid currentColor", padding: "8px 16px", cursor: "pointer", transition: "color 0.2s" }}
          >
            {isWorking ? "Finalizar" : "Iniciar"}
          </button>
        </div>

        {/* ── Stats ─────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderTop: "1px solid rgba(26,26,24,0.12)" }}>
          {[
            { value: String(stats.todayAppointments), label: "Citas hoy",     sub: `${stats.confirmedToday} conf. · ${stats.pendingToday} pend.` },
            { value: String(stats.weekAppointments),  label: "Esta semana",   sub: "Programadas" },
            { value: String(stats.totalCompleted),    label: "Completadas",   sub: "Total histórico" },
            { value: `$${stats.todayRevenue}`,        label: "Ingresos hoy",  sub: `Total $${stats.totalRevenue}` },
          ].map((s, i) => (
            <div key={i} className="orno-row" style={{ padding: "22px 0", borderRight: i < 3 ? "1px solid rgba(26,26,24,0.12)" : "none", paddingLeft: i > 0 ? "20px" : 0, paddingRight: i < 3 ? "20px" : 0 }}>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 300, lineHeight: 1, letterSpacing: "-0.02em" }}>{s.value}</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,26,24,0.45)", marginTop: "4px" }}>{s.label}</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "rgba(26,26,24,0.28)", marginTop: "2px" }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Agenda de hoy ─────────────────── */}
        <div className="pt-8 pb-3">
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(26,26,24,0.45)" }}>
            Agenda · {new Date(todayDate!).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div style={{ borderTop: "1px solid rgba(26,26,24,0.12)" }}>
          {todayAppointments.length === 0 ? (
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 300, color: "rgba(26,26,24,0.30)", padding: "24px 0" }}>Sin citas para hoy</p>
          ) : (
            todayAppointments.map((apt, i) => (
              <div key={apt.id} className="orno-row" style={{ padding: "16px 0", borderBottom: "1px solid rgba(26,26,24,0.07)", display: "flex", alignItems: "flex-start", gap: "18px" }}>
                <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "rgba(26,26,24,0.28)", minWidth: "18px", paddingTop: "3px" }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "19px", fontWeight: 400, color: "#1a1a18" }}>{apt.time} · {apt.clientName}</p>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.08em", color: apt.status === "confirmed" ? "rgba(26,26,24,0.55)" : apt.status === "completed" ? "rgba(26,26,24,0.28)" : "#cc2222", textTransform: "uppercase" }}>
                    {apt.status === "confirmed" ? "Conf." : apt.status === "completed" ? "Ok" : apt.status === "pending" ? "Pend." : "—"}
                  </span>
                </div>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(26,26,24,0.42)", marginTop: "3px" }}>
                  {apt.serviceName} · {apt.duration} min · ${apt.price}
                </p>
                {apt.notes && (
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "rgba(26,26,24,0.28)", marginTop: "2px", fontStyle: "italic" }}>{apt.notes}</p>
                )}
                {apt.status === "confirmed" && (
                  <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                    <button
                      className="orno-btn orno-complete"
                      onClick={() => handleCompleteAppointment(apt.id)}
                      style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(26,26,24,0.50)", background: "none", border: "1px solid rgba(26,26,24,0.20)", padding: "5px 12px", cursor: "pointer", transition: "color 0.15s, border-color 0.15s" }}
                    >
                      Completar
                    </button>
                    <button
                      className="orno-btn orno-cancel"
                      onClick={() => handleCancelAppointment(apt.id)}
                      style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(26,26,24,0.30)", background: "none", border: "none", padding: "5px 0", cursor: "pointer", transition: "color 0.15s" }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
            ))
          )}
        </div>

        {/* ── Próximas citas ────────────────── */}
        {upcomingAppointments.length > 0 && (
          <>
            <div className="pt-8 pb-3">
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(26,26,24,0.45)" }}>Próximas citas</p>
            </div>
            <div style={{ borderTop: "1px solid rgba(26,26,24,0.12)" }}>
              {upcomingAppointments.map((apt, i) => (
                <div key={apt.id} className="orno-row" style={{ padding: "14px 0", borderBottom: "1px solid rgba(26,26,24,0.07)", display: "flex", alignItems: "flex-start", gap: "18px" }}>
                  <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "rgba(26,26,24,0.28)", minWidth: "18px", paddingTop: "2px" }}>{String(i + 1).padStart(2, "0")}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "18px", fontWeight: 400, color: "#1a1a18" }}>
                      {new Date(apt.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · {apt.time} · {apt.clientName}
                    </p>
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(26,26,24,0.38)", marginTop: "2px" }}>{apt.serviceName}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Rendimiento ───────────────────── */}
        <div className="pt-8 pb-3">
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(26,26,24,0.45)" }}>Rendimiento</p>
        </div>
        <div className="grid grid-cols-3" style={{ borderTop: "1px solid rgba(26,26,24,0.12)", marginBottom: "60px" }}>
          {[
            { value: String(stats.totalCompleted), label: "Clientes atendidos" },
            { value: `$${stats.totalRevenue}`,     label: "Ingresos totales" },
            { value: stats.avgRating !== null ? stats.avgRating!.toFixed(1) : "—", label: stats.avgRating !== null ? `Calificación · ${stats.ratedCount} votos` : "Sin calificaciones" },
          ].map((s, i) => (
            <div key={i} className="orno-row" style={{ padding: "22px 0", borderRight: i < 2 ? "1px solid rgba(26,26,24,0.12)" : "none", paddingLeft: i > 0 ? "20px" : 0, paddingRight: i < 2 ? "20px" : 0 }}>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 300, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,26,24,0.40)", marginTop: "4px" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Comisiones del mes ─────────────── */}
        {stats.commissionPct != null && (
          <>
            <div className="pb-3">
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(26,26,24,0.45)" }}>Comisiones este mes</p>
            </div>
            <div className="grid grid-cols-2" style={{ borderTop: "1px solid rgba(26,26,24,0.12)", marginBottom: "60px" }}>
              <div className="orno-row" style={{ padding: "22px 20px 22px 0", borderRight: "1px solid rgba(26,26,24,0.12)" }}>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 300, lineHeight: 1 }}>${stats.monthCommission.toFixed(2)}</p>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,26,24,0.40)", marginTop: "4px" }}>Comisión acumulada</p>
              </div>
              <div className="orno-row" style={{ padding: "22px 0 22px 20px" }}>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 300, lineHeight: 1 }}>{stats.commissionPct?.toFixed(0) ?? "0"}%</p>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,26,24,0.40)", marginTop: "4px" }}>Tu tasa de comisión</p>
              </div>
            </div>
          </>
        )}

        {/* ── Notificaciones ────────────────── */}
        {notifications.length > 0 && (
          <>
            <div style={{ borderTop: "1px solid rgba(26,26,24,0.12)", paddingTop: "20px", marginBottom: "48px" }}>
              {notifications.slice(0, 5).map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(26,26,24,0.06)" }}>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "rgba(26,26,24,0.55)" }}>{item.message}</p>
                  <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: "10px", color: "rgba(26,26,24,0.25)" }}>
                    {new Date(item.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

      </main>
    </div>
  )
}
