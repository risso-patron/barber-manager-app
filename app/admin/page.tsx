"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"


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
    { label: "Reportes",      sub: "Análisis y métricas",                     href: "/admin/reports",      alert: false },
    { label: "Configuración", sub: "Ajustes del sistema",                     href: "/admin/settings",     alert: false },
  ]

  const todayLabel = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="min-h-screen" style={{ background: "#fafaf9", color: "#1a1a18" }}>
      <style>{`
        @keyframes ornoFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .orno-stat { animation: ornoFadeUp 0.5s ease forwards; opacity: 0; }
        .orno-stat:nth-child(1) { animation-delay: 0.05s; }
        .orno-stat:nth-child(2) { animation-delay: 0.15s; }
        .orno-stat:nth-child(3) { animation-delay: 0.25s; }
        .orno-stat:nth-child(4) { animation-delay: 0.35s; }
        .orno-mod { transition: background 0.18s; }
        .orno-mod:hover { background: rgba(26,26,24,0.03); }
        .orno-mod:hover .orno-arrow { color: #cc2222; transform: translateX(3px); }
        .orno-arrow { transition: color 0.18s, transform 0.18s; display: inline-block; }
        .orno-exit:hover { color: #cc2222 !important; }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(26,26,24,0.12)" }}>
        <div className="max-w-6xl mx-auto px-8 pt-5 pb-0 flex items-center justify-between">
          <img src="/orno_logo.svg" alt="Ornō" style={{ height: "156px", width: "auto" }} />
          <div className="flex items-center gap-6">
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "rgba(26,26,24,0.50)", letterSpacing: "0.04em" }}>
              {todayLabel}
            </span>
            <button
              onClick={handleLogout}
              className="orno-exit"
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(26,26,24,0.38)", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", background: "none", border: "none", padding: 0, transition: "color 0.2s" }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-8">

        {/* ── Stats ─────────────────────────── */}
        <div className="pt-12 pb-5">
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(26,26,24,0.45)" }}>
            Panel general
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderTop: "1px solid rgba(26,26,24,0.12)" }}>
          {[
            { value: `$${stats.monthlyRevenue.toLocaleString()}`, label: "Ingresos del mes" },
            { value: String(stats.totalAppointments),             label: `Citas · ${stats.todayAppointments} hoy` },
            { value: String(stats.totalClients),                  label: `Clientes · +${stats.newClientsMonth} este mes` },
            { value: String(stats.totalEmployees),                label: "Empleados activos" },
          ].map((stat, i) => (
            <div
              key={i}
              className="orno-stat"
              style={{
                paddingTop: "28px",
                paddingBottom: "28px",
                paddingLeft:  i % 2 !== 0 ? "24px" : "0",
                paddingRight: i % 2 === 0 ? "24px" : "0",
                borderRight: i < 3 ? "1px solid rgba(26,26,24,0.12)" : "none",
              }}
            >
              <div style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(36px,4.5vw,58px)", fontWeight: 400, lineHeight: 1, color: "#1a1a18", letterSpacing: "-0.01em" }}>
                {stat.value}
              </div>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(26,26,24,0.50)", marginTop: "8px" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Módulos ───────────────────────── */}
        <div style={{ borderTop: "1px solid rgba(26,26,24,0.12)", marginTop: "48px" }} />
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(26,26,24,0.45)", padding: "20px 0 0" }}>
          Módulos
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod, i) => (
            <button
              key={mod.href}
              onClick={() => router.push(mod.href)}
              className="orno-mod"
              style={{
                textAlign: "left",
                background: "none",
                border: "none",
                borderTop: "1px solid rgba(26,26,24,0.12)",
                borderRight: i % 3 !== 2 ? "1px solid rgba(26,26,24,0.12)" : "none",
                paddingTop: "22px",
                paddingBottom: "22px",
                paddingLeft:  i % 3 === 0 ? "0" : "20px",
                paddingRight: i % 3 === 2 ? "0" : "20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "24px", fontWeight: 400, color: "#1a1a18", lineHeight: 1.2 }}>
                  {mod.label}
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.08em", color: mod.alert ? "#cc2222" : "rgba(26,26,24,0.50)", marginTop: "4px" }}>
                  {mod.sub}
                </p>
              </div>
              <span className="orno-arrow" style={{ color: "rgba(26,26,24,0.28)", fontSize: "15px", marginTop: "3px", flexShrink: 0 }}>→</span>
            </button>
          ))}
        </div>

        {/* ── Activity + Alerts ─────────────── */}
        <div style={{ borderTop: "1px solid rgba(26,26,24,0.12)", margin: "48px 0 32px" }} />

        <div className="grid md:grid-cols-2 gap-16 pb-16">

          <div>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(26,26,24,0.45)", marginBottom: "20px" }}>
              Actividad reciente
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {[
                { title: "Nueva cita reservada",      detail: "Juan Pérez · Corte de cabello · Hoy 3:00 PM" },
                { title: "Empleado registró entrada", detail: "María García · 9:00 AM" },
                { title: "Cita completada",           detail: "Carlos Rodríguez · Barba y bigote · 11:30 AM" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "14px" }}>
                  <div style={{ width: "1px", background: "rgba(26,26,24,0.12)", alignSelf: "stretch", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "13px", color: "#1a1a18" }}>{item.title}</p>
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(26,26,24,0.52)", marginTop: "3px" }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(26,26,24,0.45)", marginBottom: "20px" }}>
              Alertas
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "14px" }}>
                <div style={{ width: "1px", background: "#cc2222", alignSelf: "stretch", flexShrink: 0 }} />
                <div>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "13px", color: "#1a1a18" }}>Stock bajo</p>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(26,26,24,0.52)", marginTop: "3px" }}>2 productos necesitan reposición</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "14px" }}>
                <div style={{ width: "1px", background: "rgba(26,26,24,0.28)", alignSelf: "stretch", flexShrink: 0 }} />
                <div>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "13px", color: "#1a1a18" }}>Citas pendientes</p>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(26,26,24,0.52)", marginTop: "3px" }}>{stats.pendingAppointments} citas esperando confirmación</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
