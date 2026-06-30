"use client"

import { useMemo, useState, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
import { getAppointmentsByEmployee } from "@/lib/demo-appointments"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Award,
  Star,
  CheckCircle,
  Clock,
  Target,
  Activity,
  MessageSquare
} from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

interface EmployeeAppointment {
  id: string
  clientId: string
  clientName: string
  serviceId: string
  serviceName: string
  date: string
  time: string
  duration: number
  price: number
  status: string
  rating?: number
  feedback?: string
  createdAt: string
}

export default function EmployeeStatsPage() {
  const user = useRequireAuth(["employee", "admin"])
  const [appointments, setAppointments] = useState<EmployeeAppointment[]>([])

  useEffect(() => {
    if (!user) return
    if (!supabase) {
      setAppointments(
        getAppointmentsByEmployee(user.id).map((apt) => ({
          id: apt.id,
          clientId: apt.clientId,
          clientName: apt.clientName,
          serviceId: apt.serviceId,
          serviceName: apt.serviceName,
          date: apt.date,
          time: apt.time,
          duration: apt.duration,
          price: apt.price,
          status: apt.status,
          rating: apt.rating,
          createdAt: apt.createdAt,
        }))
      )
      return
    }
    supabase
      .from("appointments")
      .select(`id, appointment_date, appointment_time, status, notes, rating, feedback, created_at,
        client:users!appointments_client_id_fkey(id, name, phone),
        service:services(id, name, price, duration)`)
      .eq("barber_id", user.id)
      .then(({ data }) => {
        if (data) setAppointments(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data as any[]).map(a => ({
          id: a.id,
          clientId: a.client?.id || "",
          clientName: a.client?.name || "",
          serviceId: a.service?.id || "",
          serviceName: a.service?.name || "",
          date: a.appointment_date,
          time: a.appointment_time,
          duration: a.service?.duration || 0,
          price: a.service?.price || 0,
          status: a.status,
          rating: a.rating ?? undefined,
          feedback: a.feedback ?? undefined,
          createdAt: a.created_at,
        })))
      })
  }, [user])

  const stats = useMemo(() => {
    if (!user) return null

    const myAppointments = appointments
    const completed = myAppointments.filter(apt => apt.status === "completed")
    
    const today = new Date().toISOString().split('T')[0]
    const todayAppts = myAppointments.filter(apt => apt.date === today)
    
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekAppts = myAppointments.filter(apt => new Date(apt.date) >= weekStart)
    
    const monthStart = new Date()
    monthStart.setDate(1)
    const monthAppts = myAppointments.filter(apt => new Date(apt.date) >= monthStart)
    
    const totalRevenue = completed.reduce((sum, apt) => sum + apt.price, 0)
    const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0
    
    const uniqueClients = new Set(completed.map(apt => apt.clientId)).size

    // Rating real desde BD
    const rated = completed.filter(apt => apt.rating !== null && apt.rating !== undefined && apt.rating > 0)
    const avgRating = rated.length > 0
      ? rated.reduce((sum, apt) => sum + (apt.rating ?? 0), 0) / rated.length
      : null

    const feedbackEntries = completed
      .filter((apt) => typeof apt.feedback === "string" && apt.feedback.trim().length > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const positiveFeedbackCount = feedbackEntries.filter((apt) => (apt.rating ?? 0) >= 4).length
    
    // Service popularity
    const serviceStats = completed.reduce((acc, apt) => {
      if (!acc[apt.serviceName]) {
        acc[apt.serviceName] = { count: 0, revenue: 0 }
      }
      acc[apt.serviceName]!.count++
      acc[apt.serviceName]!.revenue += apt.price
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)
    
    const topServices = Object.entries(serviceStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
    
    // Performance by day
    const dayStats = completed.reduce((acc, apt) => {
      const day = new Date(apt.date).toLocaleDateString('es-ES', { weekday: 'long' })
      if (!acc[day]) {
        acc[day] = { count: 0, revenue: 0 }
      }
      acc[day].count++
      acc[day].revenue += apt.price
      return acc
    }, {} as Record<string, { count: number; revenue: 0 }>)
    
    const bestDay = Object.entries(dayStats)
      .sort((a, b) => b[1].revenue - a[1].revenue)[0]
    
    // Datos para gráfico de barras
    const chartData = topServices.map(([name, data]) => ({
      name: name.length > 12 ? name.slice(0, 12) + "…" : name,
      fullName: name,
      servicios: data.count,
      ingresos: data.revenue,
    }))

    return {
      totalCompleted: completed.length,
      todayAppts: todayAppts.length,
      weekAppts: weekAppts.length,
      monthAppts: monthAppts.length,
      totalRevenue,
      avgTicket,
      uniqueClients,
      topServices,
      chartData,
      bestDay,
      avgRating,
      ratedCount: rated.length,
      feedbackCount: feedbackEntries.length,
      positiveFeedbackRate:
        feedbackEntries.length > 0 ? (positiveFeedbackCount / feedbackEntries.length) * 100 : 0,
      recentFeedbacks: feedbackEntries.slice(0, 5),
      completionRate: myAppointments.length > 0 ? (completed.length / myAppointments.length) * 100 : 0
    }
  }, [user, appointments])

  if (!user || !stats) return null

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
      `}</style>

      {/* ── Header ── */}
      <div className="pt-8 pb-3">
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(28px,4vw,40px)", fontWeight: 300, color: "#F0F0F0", letterSpacing: "-0.02em" }}>Estadísticas</p>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>Análisis de rendimiento y desempeño</p>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderTop: "1px solid #252525", marginBottom: "40px" }}>
        {[
          { value: String(stats.totalCompleted), label: "Completados",        sub: "Total histórico" },
          { value: `$${stats.totalRevenue}`,     label: "Ingresos generados", sub: `Ticket prom. $${stats.avgTicket.toFixed(2)}` },
          { value: String(stats.uniqueClients),  label: "Clientes únicos",    sub: "Atendidos" },
          {
            value: stats.avgRating !== null ? `${stats.avgRating.toFixed(1)}★` : "—",
            label: "Calificación",
            sub:   stats.avgRating !== null ? `${stats.ratedCount} reseña${stats.ratedCount !== 1 ? "s" : ""}` : "Sin datos",
          },
        ].map((s, i) => (
          <div key={i} className="orno-row" style={{ padding: "22px 0", borderRight: i < 3 ? "1px solid #252525" : "none", paddingLeft: i > 0 ? "20px" : 0, paddingRight: i < 3 ? "20px" : 0 }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(24px,3.5vw,40px)", fontWeight: 300, lineHeight: 1, color: "#F0F0F0" }}>{s.value}</p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#555555", marginTop: "2px" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Period stats ── */}
      <div className="pb-3">
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8A8A" }}>Actividad</p>
      </div>
      <div className="grid grid-cols-3" style={{ borderTop: "1px solid #252525", marginBottom: "40px" }}>
        {[
          { value: String(stats.todayAppts), label: "Hoy",         sub: "Programadas" },
          { value: String(stats.weekAppts),  label: "Esta semana", sub: "Programadas" },
          { value: String(stats.monthAppts), label: "Este mes",    sub: "Total" },
        ].map((s, i) => (
          <div key={i} className="orno-row" style={{ padding: "20px 0", borderRight: i < 2 ? "1px solid #252525" : "none", paddingLeft: i > 0 ? "20px" : 0, paddingRight: i < 2 ? "20px" : 0 }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(24px,3vw,36px)", fontWeight: 300, lineHeight: 1, color: "#F0F0F0" }}>{s.value}</p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#555555", marginTop: "2px" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
      {stats.chartData.length > 0 && (
        <>
          <div className="pb-3">
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8A8A" }}>Servicios por ingresos</p>
          </div>
          <div style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: "8px", padding: "24px", marginBottom: "40px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2E2E2E" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8A8A8A", fontFamily: "var(--font-dm-sans)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#555555" }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#222222", border: "1px solid #2E2E2E", borderRadius: "4px", fontFamily: "var(--font-dm-sans)", fontSize: "11px" }}
                  labelStyle={{ color: "#F0F0F0" }}
                  itemStyle={{ color: "#8A8A8A" }}
                  formatter={(value: number, name: string) =>
                    name === "ingresos" ? [`$${(value as number).toFixed(2)}`, "Ingresos"] : [value, "Servicios"]
                  }
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(label, payload: any[]) => payload?.[0]?.payload?.fullName ?? label}
                />
                <Bar dataKey="ingresos" fill="#E53935" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ── Top Services + Best Day ── */}
      <div className="grid gap-6 md:grid-cols-2" style={{ marginBottom: "40px" }}>
        <div style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: "8px", padding: "24px" }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 300, color: "#F0F0F0", marginBottom: "4px" }}>Servicios destacados</p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginBottom: "20px" }}>Tus especialidades más solicitadas</p>
          {stats.topServices.length > 0 ? (
            stats.topServices.map(([service, data], index) => (
              <div key={service} className="orno-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "#555555", minWidth: "16px" }}>{String(index+1).padStart(2,"0")}</span>
                  <div>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "16px", fontWeight: 400, color: "#F0F0F0" }}>{service}</p>
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#8A8A8A" }}>{data.count} veces</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: "13px", color: "#E53935" }}>${data.revenue.toFixed(2)}</p>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#555555" }}>${(data.revenue / data.count).toFixed(2)} c/u</p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "18px", fontWeight: 300, color: "#555555", padding: "8px 0" }}>Sin servicios completados aún</p>
          )}
        </div>

        <div style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: "8px", padding: "24px" }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 300, color: "#F0F0F0", marginBottom: "4px" }}>Mejor día</p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginBottom: "20px" }}>Tu día más productivo</p>
          {stats.bestDay ? (
            <div>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(28px,4vw,44px)", fontWeight: 300, color: "#F0F0F0", textTransform: "capitalize", marginBottom: "20px" }}>{stats.bestDay[0]}</p>
              <div className="grid grid-cols-2" style={{ borderTop: "1px solid #252525" }}>
                <div style={{ padding: "16px 16px 16px 0", borderRight: "1px solid #252525" }}>
                  <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "32px", fontWeight: 300, color: "#F0F0F0" }}>{stats.bestDay[1].count}</p>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "2px" }}>Servicios</p>
                </div>
                <div style={{ padding: "16px 0 16px 16px" }}>
                  <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: "22px", color: "#E53935" }}>${stats.bestDay[1].revenue.toFixed(2)}</p>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "2px" }}>Ingresos</p>
                </div>
              </div>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#555555", marginTop: "12px" }}>
                Promedio: ${(stats.bestDay[1].revenue / stats.bestDay[1].count).toFixed(2)} por servicio
              </p>
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "18px", fontWeight: 300, color: "#555555" }}>Sin datos suficientes</p>
          )}
        </div>
      </div>

      {/* ── Feedback ── */}
      {stats.recentFeedbacks.length > 0 && (
        <>
          <div className="pb-3">
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8A8A" }}>
              Feedback · {stats.feedbackCount} comentario{stats.feedbackCount !== 1 ? "s" : ""}
              {stats.feedbackCount > 0 && ` · ${stats.positiveFeedbackRate.toFixed(0)}% positivo`}
            </p>
          </div>
          <div style={{ borderTop: "1px solid #252525", marginBottom: "40px" }}>
            {stats.recentFeedbacks.map((apt) => (
              <div key={apt.id} className="orno-row" style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "17px", fontWeight: 400, color: "#F0F0F0" }}>{apt.clientName || "Cliente"}</p>
                  <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "10px", color: "#555555" }}>
                    {new Date(apt.date).toLocaleDateString("es-ES")}
                    {apt.rating !== null && apt.rating !== undefined && apt.rating > 0 && ` · ★ ${apt.rating.toFixed(1)}`}
                  </span>
                </div>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginBottom: "4px" }}>{apt.serviceName}</p>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "#F0F0F0", fontStyle: "italic" }}>{apt.feedback}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Rendimiento ── */}
      <div className="pb-3">
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8A8A" }}>Rendimiento</p>
      </div>
      <div className="grid grid-cols-3" style={{ borderTop: "1px solid #252525" }}>
        {[
          { value: `${stats.completionRate.toFixed(1)}%`, label: "Eficiencia",   sub: "Tasa de finalización" },
          { value: String(stats.uniqueClients),           label: "Clientes",     sub: "Únicos atendidos" },
          { value: `$${stats.avgTicket.toFixed(2)}`,      label: "Ticket prom.", sub: "Ingreso por servicio" },
        ].map((s, i) => (
          <div key={i} className="orno-row" style={{ padding: "20px 0", borderRight: i < 2 ? "1px solid #252525" : "none", paddingLeft: i > 0 ? "20px" : 0, paddingRight: i < 2 ? "20px" : 0 }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(24px,3vw,36px)", fontWeight: 300, lineHeight: 1, color: "#E53935" }}>{s.value}</p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#555555", marginTop: "2px" }}>{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
