import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Calendar, Users, DollarSign, Clock, AlertTriangle } from "lucide-react"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createServerSupabaseClient()

  // Get dashboard stats based on user role
  const getDashboardStats = async () => {
    const today = new Date().toISOString().split("T")[0]

    if (user.role === "admin") {
      // Admin dashboard stats
      const [appointmentsResult, employeesResult, inventoryResult] = await Promise.all([
        supabase.from("appointments").select("*", { count: "exact" }),
        supabase.from("users").select("*", { count: "exact" }).eq("role", "employee"),
        supabase
          .from("inventory")
          .select("*")
          .lt("quantity", 10), // Low stock items
      ])

      const todayAppointments = await supabase
        .from("appointments")
        .select("*", { count: "exact" })
        .eq("appointment_date", today)

      return {
        totalAppointments: appointmentsResult.count || 0,
        todayAppointments: todayAppointments.count || 0,
        totalEmployees: employeesResult.count || 0,
        lowStockItems: inventoryResult.data?.length || 0,
      }
    } else if (user.role === "employee") {
      // Employee dashboard stats
      const todayAppointments = await supabase
        .from("appointments")
        .select("*", { count: "exact" })
        .eq("barber_id", user.id)
        .eq("appointment_date", today)

      const monthlyAppointments = await supabase
        .from("appointments")
        .select("*", { count: "exact" })
        .eq("barber_id", user.id)
        .gte(
          "appointment_date",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
        )

      return {
        todayAppointments: todayAppointments.count || 0,
        monthlyAppointments: monthlyAppointments.count || 0,
      }
    } else {
      // Client dashboard stats
      const userAppointments = await supabase
        .from("appointments")
        .select("*", { count: "exact" })
        .eq("client_id", user.id)

      const upcomingAppointments = await supabase
        .from("appointments")
        .select("*", { count: "exact" })
        .eq("client_id", user.id)
        .gte("appointment_date", today)
        .eq("status", "confirmed")

      return {
        totalAppointments: userAppointments.count || 0,
        upcomingAppointments: upcomingAppointments.count || 0,
      }
    }
  }

  const stats = await getDashboardStats()

  const renderDashboardContent = () => {
    switch (user.role) {
      case "admin":
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Citas Totales"
              value={stats.totalAppointments}
              icon={Calendar}
              description="Total de citas registradas"
            />
            <StatsCard
              title="Citas Hoy"
              value={stats.todayAppointments}
              icon={Clock}
              description="Citas programadas para hoy"
            />
            <StatsCard title="Empleados" value={stats.totalEmployees} icon={Users} description="Barberos registrados" />
            <StatsCard
              title="Stock Bajo"
              value={stats.lowStockItems}
              icon={AlertTriangle}
              description="Productos con stock bajo"
            />
          </div>
        )
      case "employee":
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="Citas Hoy"
              value={stats.todayAppointments}
              icon={Calendar}
              description="Tus citas de hoy"
            />
            <StatsCard
              title="Citas del Mes"
              value={stats.monthlyAppointments}
              icon={Clock}
              description="Total del mes actual"
            />
            <StatsCard title="Estado" value="Activo" icon={Users} description="Tu estado actual" />
          </div>
        )
      case "client":
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="Mis Citas"
              value={stats.totalAppointments}
              icon={Calendar}
              description="Total de citas realizadas"
            />
            <StatsCard
              title="Próximas Citas"
              value={stats.upcomingAppointments}
              icon={Clock}
              description="Citas confirmadas"
            />
            <StatsCard title="Puntos" value="0" icon={DollarSign} description="Puntos de fidelidad" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido, {user.name}</h1>
        <p className="text-muted-foreground">Aquí tienes un resumen de tu actividad</p>
      </div>

      {renderDashboardContent()}
    </div>
  )
}
