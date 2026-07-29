"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Plus, TrendingUp } from "lucide-react"
import { DEMO_APPOINTMENTS, DEMO_CLIENTS, DEMO_EMPLOYEES } from "@/lib/demo"


interface DashboardStats {
  totalAppointments: number
  todayAppointments: number
  totalEmployees: number
  activeEmployees: number
  totalClients: number
  newClientsMonth: number
  monthlyRevenue: number
  pendingAppointments: number
}

interface LowRatingAlert {
  id: string
  appointment_id: string
  rating: number
  review_text: string | null
  is_resolved: boolean
  created_at: string
  client: { id: string; name: string } | null
  employee: { id: string; name: string } | null
}

interface RevenueAppointment {
  service: { price: number | null } | null
}

interface ActivityItem {
  title: string
  detail: string
}

interface RecentApptRow {
  appointment_date: string
  appointment_time: string
  status: string
  client: { name: string } | null
  service: { name: string } | null
}

function activityLabel(status: string): string {
  if (status === "completed") return "Cita completada"
  if (status === "confirmed") return "Cita confirmada"
  if (status === "cancelled") return "Cita cancelada"
  if (status === "no_show") return "No se presentó"
  return "Cita agendada"
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null


export default function AdminDashboard() {
  const router = useRouter()
  const user = useRequireAuth(["admin"])
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    totalClients: 0,
    newClientsMonth: 0,
    monthlyRevenue: 0,
    pendingAppointments: 0,
  })
const [alerts, setAlerts] = useState<LowRatingAlert[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])

  useEffect(() => {
    const loadStats = async () => {
      if (!supabase) {
        // Demo mode: derive stats from real demo data (same source as reports page)
        const todayStr = new Date().toISOString().split("T")[0]!
        const thisMonth = new Date().toISOString().slice(0, 7)
        setStats({
          totalAppointments: DEMO_APPOINTMENTS.length,
          todayAppointments: DEMO_APPOINTMENTS.filter(a => a.date === todayStr).length,
          pendingAppointments: DEMO_APPOINTMENTS.filter(a => a.status === "pending").length,
          totalEmployees: DEMO_EMPLOYEES.length,
          activeEmployees: DEMO_EMPLOYEES.length,
          totalClients: DEMO_CLIENTS.length,
          newClientsMonth: DEMO_CLIENTS.filter(c => c.createdAt?.startsWith(thisMonth) ?? false).length,
          monthlyRevenue: DEMO_APPOINTMENTS
            .filter(a => a.status === "completed" && a.date.startsWith(thisMonth))
            .reduce((sum, a) => sum + a.price, 0),
        })
        const sorted = [...DEMO_APPOINTMENTS]
          .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
          .slice(0, 3)
        setRecentActivity(sorted.map(a => ({
          title: activityLabel(a.status),
          detail: `${a.clientName} · ${a.serviceName} · ${a.date} ${a.time}`,
        })))
        return
      }

      // Supabase mode: fetch from API
      try {
        const res = await fetch("/api/dashboard/stats")
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch { /* keep zeros */ }

      supabase
        .from("appointments")
        .select(`
          appointment_date, appointment_time, status,
          client:users!appointments_client_id_fkey(name),
          service:services(name)
        `)
        .order("appointment_date", { ascending: false })
        .limit(3)
        .then(
          ({ data }) => {
            if (data) {
              setRecentActivity((data as unknown as RecentApptRow[]).map(a => ({
                title: activityLabel(a.status),
                detail: `${a.client?.name ?? "Cliente"} · ${a.service?.name ?? "Servicio"} · ${a.appointment_date}`,
              })))
            }
          },
          () => {}
        )

      // Low-rating alerts (non-critical)
      fetch("/api/alerts")
        .then((r) => r.json())
        .then((d: { alerts?: LowRatingAlert[] }) => {
          if (Array.isArray(d.alerts)) setAlerts(d.alerts)
        })
        .catch(() => {})
    }

    void loadStats()
  }, [])

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
    }
    router.push("/auth/login")
  }

  const modules = [
    { label: "Citas",         sub: `${stats.pendingAppointments} pendientes`, href: "/admin/appointments", alert: stats.pendingAppointments > 0 },
    { label: "Empleados",     sub: `${stats.activeEmployees} activos`,        href: "/admin/employees",    alert: false },
    { label: "Servicios",     sub: "Catálogo",                                href: "/admin/services",     alert: false },
    { label: "Inventario",    sub: "Stock y productos",                       href: "/admin/inventory",    alert: false },
    { label: "Punto de Venta", sub: "Ventas directas",                        href: "/admin/pos",          alert: false },
    { label: "Reportes",      sub: "Análisis y métricas",                     href: "/admin/reports",      alert: false },
    { label: "Configuración", sub: "Ajustes del sistema",                     href: "/admin/settings",     alert: false },
  ]

  const todayLabel = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  // Clases literales completas — Tailwind necesita el string estático en el
  // código fuente para generar el CSS de un valor arbitrario (no funciona
  // con interpolación dinámica).
  const KPI_DELAY_CLASS = ["[animation-delay:50ms]", "[animation-delay:150ms]", "[animation-delay:250ms]", "[animation-delay:350ms]"]

  const kpiCards = [
    { label: "INGRESOS DEL MES",  value: `$${stats.monthlyRevenue.toLocaleString()}`, trend: null, trendUp: null },
    { label: "CITAS HOY",         value: String(stats.todayAppointments),             trend: `${stats.totalAppointments} total`,    trendUp: null },
    { label: "CLIENTES",          value: String(stats.totalClients),                  trend: `+${stats.newClientsMonth} este mes`,  trendUp: stats.newClientsMonth > 0 },
    { label: "EMPLEADOS ACTIVOS", value: String(stats.totalEmployees),                trend: null,                                  trendUp: null },
  ]

  return (
    <div className="p-4 lg:p-8 text-foreground">

      {/* ── Page header ─────────────────────── */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="m-0 text-[22px] font-semibold leading-[1.3] text-foreground">
            Panel general
          </h1>
          <p className="mt-1 text-[13px] text-ink-600">
            {todayLabel}
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/appointments")}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-colors duration-micro hover:bg-sage-600"
        >
          <Plus size={14} />
          Nueva cita
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────── */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div
            key={card.label}
            className={`animate-fade-up cursor-default rounded-xl border border-border bg-card px-6 py-5 shadow-raised transition-shadow duration-micro ${KPI_DELAY_CLASS[i] ?? ""}`}
          >
            <div className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-600">
              {card.label}
            </div>
            <div className="mb-2 font-mono text-[32px] font-bold leading-none text-foreground">
              {card.value}
            </div>
            {card.trend && (
              <div className="flex items-center gap-1">
                {card.trendUp === true && <TrendingUp size={12} className="text-success-text" />}
                <span className={`text-xs ${card.trendUp === true ? "text-success-text" : "text-ink-600"}`}>
                  {card.trend}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Módulos ─────────────────────────── */}
      <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-ink-600">
        Accesos rápidos
      </div>
      <div className="mb-6 grid grid-cols-4 gap-3">
        {modules.map((mod) => (
          <button
            key={mod.href}
            onClick={() => router.push(mod.href)}
            className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors duration-micro hover:bg-secondary"
          >
            <div>
              <p className="m-0 font-serif text-lg font-normal leading-[1.2] text-foreground">
                {mod.label}
              </p>
              <p className={`mt-1 text-[11px] ${mod.alert ? "text-danger-text" : "text-ink-600"}`}>
                {mod.sub}
              </p>
            </div>
            <span className="mt-0.5 shrink-0 text-sm text-ink-600 transition-all duration-micro group-hover:translate-x-1 group-hover:text-foreground">
              →
            </span>
          </button>
        ))}
      </div>

      {/* ── Activity + Alerts ───────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Actividad reciente */}
        <div className="rounded-xl border border-border bg-card px-6 py-5 shadow-raised">
          <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-600">
            Actividad reciente
          </div>
          <div className="flex flex-col gap-3.5">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-ink-600">
                Sin actividad reciente
              </p>
            ) : recentActivity.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-px shrink-0 self-stretch bg-border" />
                <div>
                  <p className="text-[13px] text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-600">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        <div className="rounded-xl border border-border bg-card px-6 py-5 shadow-raised">
          <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-600">
            Alertas
          </div>
          <div className="flex flex-col gap-3.5">
            {alerts.length > 0 ? (
              alerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="flex gap-3">
                  <div
                    className={`w-[3px] shrink-0 self-stretch rounded-sm ${alert.rating === 1 ? "bg-danger" : "bg-warning"}`}
                  />
                  <div className="flex-1">
                    <p className="text-[13px] text-foreground">
                      {"★".repeat(alert.rating)}{"☆".repeat(5 - alert.rating)}{" "}
                      {alert.client?.name ?? "Cliente"}
                    </p>
                    {alert.review_text && (
                      <p className="mt-0.5 text-[11px] italic text-ink-600">
                        &ldquo;{alert.review_text}&rdquo;
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-ink-600">
                      {alert.employee?.name ?? ""} ·{" "}
                      {new Date(alert.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-600">
                Sin alertas pendientes
              </p>
            )}
            {stats.pendingAppointments > 0 && (
              <div className="flex gap-3">
                <div className="w-[3px] shrink-0 self-stretch rounded-sm bg-border" />
                <div>
                  <p className="text-[13px] text-foreground">
                    Citas pendientes
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-600">
                    {stats.pendingAppointments} esperando confirmación
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
