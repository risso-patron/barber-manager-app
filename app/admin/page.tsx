"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Plus, TrendingUp } from "lucide-react"


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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

const DEMO_STATS: DashboardStats = {
  totalAppointments: 14,
  todayAppointments: 3,
  totalEmployees: 3,
  activeEmployees: 3,
  totalClients: 24,
  newClientsMonth: 6,
  monthlyRevenue: 840,
  pendingAppointments: 2,
}

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

  useEffect(() => {
    const loadStats = async () => {
      if (!supabase) {
        setStats(DEMO_STATS)
        return
      }

      const today = new Date().toISOString().split("T")[0]
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

      try {
        const [
          { count: totalAppointments },
          { count: todayAppointments },
          { count: pendingAppointments },
          { count: totalEmployees },
          { count: totalClients },
          { count: newClientsMonth },
          { data: revenueData },
        ] = await Promise.all([
          supabase.from("appointments").select("*", { count: "exact", head: true }),
          supabase.from("appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today),
          supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "employee"),
          supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "client"),
          supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "client").gte("created_at", firstOfMonth),
          supabase.from("appointments").select("service:services(price)").eq("status", "completed").gte("appointment_date", firstOfMonth),
        ])

        const revenueRows = (revenueData ?? []) as unknown as RevenueAppointment[]
        const monthlyRevenue = revenueRows.reduce((sum, appointment) => sum + (appointment.service?.price ?? 0), 0)

        setStats({
          totalAppointments: totalAppointments || 0,
          todayAppointments: todayAppointments || 0,
          totalEmployees: totalEmployees || 0,
          activeEmployees: totalEmployees || 0,
          totalClients: totalClients || 0,
          newClientsMonth: newClientsMonth || 0,
          monthlyRevenue,
          pendingAppointments: pendingAppointments || 0,
        })
      } catch (error) {
        console.warn("No se pudieron cargar estadísticas admin, usando datos demo:", error)
        setStats(DEMO_STATS)
      }

      // Low-rating alerts (non-critical — don't block main stats)
      fetch("/api/alerts")
        .then((r) => r.json())
        .then((d: { alerts?: LowRatingAlert[] }) => { if (Array.isArray(d.alerts)) setAlerts(d.alerts) })
        .catch(() => { /* non-critical */ })
    }

    loadStats()
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

  const kpiCards = [
    { label: "INGRESOS DEL MES",  value: `$${stats.monthlyRevenue.toLocaleString()}`, trend: null, trendUp: null },
    { label: "CITAS HOY",         value: String(stats.todayAppointments),             trend: `${stats.totalAppointments} total`,    trendUp: null },
    { label: "CLIENTES",          value: String(stats.totalClients),                  trend: `+${stats.newClientsMonth} este mes`,  trendUp: stats.newClientsMonth > 0 },
    { label: "EMPLEADOS ACTIVOS", value: String(stats.totalEmployees),                trend: null,                                  trendUp: null },
  ]

  return (
    <div
      style={{
        padding: 32,
        fontFamily: "var(--font-dm-sans), sans-serif",
        color: "#F0F0F0",
      }}
    >
      <style>{`
        @keyframes ornoFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .orno-kpi { animation: ornoFadeUp 0.5s ease forwards; opacity: 0; }
        .orno-kpi:nth-child(1) { animation-delay: 0.05s; }
        .orno-kpi:nth-child(2) { animation-delay: 0.15s; }
        .orno-kpi:nth-child(3) { animation-delay: 0.25s; }
        .orno-kpi:nth-child(4) { animation-delay: 0.35s; }
        .orno-kpi:hover { transform: scale(1.02); box-shadow: 0 4px 16px rgba(0,0,0,0.5); }
        .orno-mod-btn { transition: background 0.15s, box-shadow 0.15s; }
        .orno-mod-btn:hover { background: #252525 !important; }
        .orno-mod-btn:hover .orno-arrow { color: #E53935 !important; transform: translateX(3px); }
        .orno-arrow { transition: color 0.15s, transform 0.15s; display: inline-block; }
      `}</style>

      {/* ── Page header ─────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 600,
              color: "#F0F0F0",
              lineHeight: 1.3,
              fontFamily: "var(--font-dm-sans), sans-serif",
            }}
          >
            Panel general
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "#8A8A8A",
              fontFamily: "var(--font-dm-sans), sans-serif",
            }}
          >
            {todayLabel}
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/appointments")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#E53935",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0 16px",
            height: 36,
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(229,57,53,0.25)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FF4444" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#E53935" }}
        >
          <Plus size={14} />
          Nueva cita
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="orno-kpi"
            style={{
              background: "#1A1A1A",
              border: "1px solid #2E2E2E",
              borderRadius: 12,
              padding: "20px 24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)",
              transition: "transform 0.15s, box-shadow 0.15s",
              cursor: "default",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#8A8A8A",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 10,
                fontFamily: "var(--font-dm-sans), sans-serif",
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: 32,
                fontWeight: 700,
                color: "#F0F0F0",
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              {card.value}
            </div>
            {card.trend && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {card.trendUp === true && <TrendingUp size={12} style={{ color: "#22C55E" }} />}
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 12,
                    color: card.trendUp === true ? "#22C55E" : "#8A8A8A",
                  }}
                >
                  {card.trend}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Módulos ─────────────────────────── */}
      <div
        style={{
          fontSize: 11,
          color: "#555555",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginBottom: 12,
          fontFamily: "var(--font-dm-sans), sans-serif",
        }}
      >
        Accesos rápidos
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {modules.map((mod) => (
          <button
            key={mod.href}
            onClick={() => router.push(mod.href)}
            className="orno-mod-btn"
            style={{
              textAlign: "left",
              background: "#1A1A1A",
              border: "1px solid #2E2E2E",
              borderRadius: 12,
              padding: "16px 20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: 18,
                  fontWeight: 400,
                  color: "#F0F0F0",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {mod.label}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 11,
                  color: mod.alert ? "#E53935" : "#8A8A8A",
                  marginTop: 4,
                }}
              >
                {mod.sub}
              </p>
            </div>
            <span className="orno-arrow" style={{ color: "#555555", fontSize: 14, marginTop: 3, flexShrink: 0 }}>
              →
            </span>
          </button>
        ))}
      </div>

      {/* ── Activity + Alerts ───────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {/* Actividad reciente */}
        <div
          style={{
            background: "#1A1A1A",
            border: "1px solid #2E2E2E",
            borderRadius: 12,
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#8A8A8A",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 16,
              fontFamily: "var(--font-dm-sans), sans-serif",
            }}
          >
            Actividad reciente
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { title: "Nueva cita reservada",      detail: "Juan Pérez · Corte de cabello · Hoy 3:00 PM" },
              { title: "Empleado registró entrada", detail: "María García · 9:00 AM" },
              { title: "Cita completada",           detail: "Carlos Rodríguez · Barba y bigote · 11:30 AM" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 1, background: "#252525", alignSelf: "stretch", flexShrink: 0 }} />
                <div>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "#F0F0F0" }}>
                    {item.title}
                  </p>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, color: "#8A8A8A", marginTop: 2 }}>
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        <div
          style={{
            background: "#1A1A1A",
            border: "1px solid #2E2E2E",
            borderRadius: 12,
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#8A8A8A",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 16,
              fontFamily: "var(--font-dm-sans), sans-serif",
            }}
          >
            Alertas
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {alerts.length > 0 ? (
              alerts.slice(0, 4).map((alert) => (
                <div key={alert.id} style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      width: 3,
                      borderRadius: 2,
                      background: alert.rating === 1 ? "#E53935" : "#F59E0B",
                      alignSelf: "stretch",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "#F0F0F0" }}>
                      {"★".repeat(alert.rating)}{"☆".repeat(5 - alert.rating)}{" "}
                      {alert.client?.name ?? "Cliente"}
                    </p>
                    {alert.review_text && (
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans), sans-serif",
                          fontSize: 11,
                          color: "#8A8A8A",
                          marginTop: 2,
                          fontStyle: "italic",
                        }}
                      >
                        &ldquo;{alert.review_text}&rdquo;
                      </p>
                    )}
                    <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 10, color: "#555555", marginTop: 3 }}>
                      {alert.employee?.name ?? ""} ·{" "}
                      {new Date(alert.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, color: "#555555" }}>
                Sin alertas pendientes
              </p>
            )}
            {stats.pendingAppointments > 0 && (
              <div style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    width: 3,
                    borderRadius: 2,
                    background: "#2E2E2E",
                    alignSelf: "stretch",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "#F0F0F0" }}>
                    Citas pendientes
                  </p>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, color: "#8A8A8A", marginTop: 2 }}>
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
