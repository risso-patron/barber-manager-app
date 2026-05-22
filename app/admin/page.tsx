"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Package, Clock, DollarSign, TrendingUp, AlertTriangle, Scissors, LogOut } from "lucide-react"

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
  service: {
    price: number | null
  } | null
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

        const revenueRows = (revenueData ?? []) as RevenueAppointment[]
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
              <p className="text-gray-600 mt-1">Panel de control y gestión general</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push("/")}
                variant="outline"
              >
                Ir al Inicio
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Totales</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.todayAppointments} citas hoy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Empleados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeEmployees} activos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.newClientsMonth} este mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 text-green-500" /> +12% vs mes anterior
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Gestión de Citas
                </CardTitle>
                <CardDescription>
                  Administra todas las citas de la barbería
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => router.push("/admin/appointments")}
                  >
                    Ver Todas las Citas
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/admin/appointments")}
                  >
                    Nueva Cita
                  </Button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  {stats.pendingAppointments} citas pendientes
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Gestión de Empleados
                </CardTitle>
                <CardDescription>
                  Administra barberos y personal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => router.push("/admin/employees")}
                  >
                    Ver Empleados
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/admin/employees")}
                  >
                    Agregar Empleado
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-purple-500" />
                  Gestión de Servicios
                </CardTitle>
                <CardDescription>
                  Administra los servicios ofrecidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => router.push("/admin/services")}
                  >
                    Ver Servicios
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/admin/services")}
                  >
                    Agregar Servicio
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-500" />
                  Inventario
                </CardTitle>
                <CardDescription>
                  Control de productos y stock
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => router.push("/admin/inventory")}
                  >
                    Ver Inventario
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/admin/inventory")}
                  >
                    Agregar Producto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Alerts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimas acciones en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Nueva cita reservada</p>
                      <p className="text-xs text-muted-foreground">
                        Juan Pérez - Corte de cabello - Hoy 3:00 PM
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Empleado registró entrada</p>
                      <p className="text-xs text-muted-foreground">
                        María García - 9:00 AM
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Cita completada</p>
                      <p className="text-xs text-muted-foreground">
                        Carlos Rodríguez - Barba y bigote - 11:30 AM
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas del Sistema</CardTitle>
                <CardDescription>Notificaciones importantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-yellow-900">Stock Bajo</p>
                      <p className="text-xs text-yellow-700">
                        2 productos necesitan reposición
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900">Citas Pendientes</p>
                      <p className="text-xs text-blue-700">
                        8 citas esperando confirmación
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
