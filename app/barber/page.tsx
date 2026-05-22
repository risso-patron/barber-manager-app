"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, DollarSign, TrendingUp, CheckCircle, LogOut } from "lucide-react"

interface TodayAppointment {
  id: string
  client: string
  service: string
  time: string
  price: number
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled"
}

interface Stats {
  todayTotal: number
  todayCompleted: number
  weekTotal: number
  monthRevenue: number
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BarberDashboard() {
  const router = useRouter()
  const user = useRequireAuth(["employee", "barber", "admin"])
  const [isWorking, setIsWorking] = useState(false)
  const [workStartTime, setWorkStartTime] = useState<string | null>(null)

  const [appointments, setAppointments] = useState<TodayAppointment[]>([])
  const [stats, setStats] = useState<Stats>({ todayTotal: 0, todayCompleted: 0, weekTotal: 0, monthRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    // Check if already working
    const workStatus = sessionStorage.getItem("workStatus")
    if (workStatus) {
      const status = JSON.parse(workStatus)
      setIsWorking(status.isWorking)
      setWorkStartTime(status.startTime)
    }

    loadData(user.id)
  }, [user])

  const loadData = async (barberId: string) => {
    setLoading(true)
    const today = new Date().toISOString().split("T")[0]
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    const [todayResult, weekResult, monthResult] = await Promise.all([
      supabase
        .from("appointments")
        .select(`id, appointment_time, status, services ( name, price ), users!appointments_client_id_fkey ( name )`)
        .eq("barber_id", barberId)
        .eq("appointment_date", today)
        .neq("status", "cancelled")
        .order("appointment_time"),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("barber_id", barberId)
        .gte("appointment_date", startOfWeek.toISOString().split("T")[0])
        .neq("status", "cancelled"),
      supabase
        .from("appointments")
        .select("services ( price )")
        .eq("barber_id", barberId)
        .eq("status", "completed")
        .gte("appointment_date", startOfMonth.toISOString().split("T")[0]),
    ])

    if (todayResult.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (todayResult.data as any[]).map((a) => ({
        id: a.id,
        client: a.users?.name ?? "Cliente",
        service: a.services?.name ?? "Servicio",
        time: a.appointment_time?.slice(0, 5) ?? "",
        price: a.services?.price ?? 0,
        status: a.status as TodayAppointment["status"],
      }))
      setAppointments(mapped)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const monthRevenue = (monthResult.data as any[] ?? []).reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, a: any) => sum + (a.services?.price ?? 0), 0
      )
      setStats({
        todayTotal: mapped.length,
        todayCompleted: mapped.filter((a) => a.status === "completed").length,
        weekTotal: weekResult.count ?? 0,
        monthRevenue,
      })
    }
    setLoading(false)
  }

  const handleStatusChange = async (id: string, newStatus: TodayAppointment["status"]) => {
    setUpdatingId(id)
    const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", id)
    if (!error) {
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)))
      if (user) loadData(user.id)
    }
    setUpdatingId(null)
  }

  if (!user) {
    return null
  }

  const handleClockIn = () => {
    const now = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
    setIsWorking(true)
    setWorkStartTime(now)
    sessionStorage.setItem(
      "workStatus",
      JSON.stringify({ isWorking: true, startTime: now })
    )
  }

  const handleClockOut = () => {
    setIsWorking(false)
    setWorkStartTime(null)
    sessionStorage.removeItem("workStatus")
  }

  const handleLogout = async () => {
    sessionStorage.removeItem("workStatus")
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "confirmed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada"
      case "in-progress":
        return "En progreso"
      case "confirmed":
        return "Confirmada"
      case "pending":
        return "Pendiente"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mi Espacio de Trabajo</h1>
              <p className="text-indigo-100 mt-1">
                {new Date().toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {user.name && <p className="text-indigo-200 text-sm mt-0.5">Bienvenido, {user.name}</p>}
            </div>
            <div className="flex items-center gap-4">
              {isWorking ? (
                <div className="text-right">
                  <div className="text-sm text-indigo-100">Jornada iniciada</div>
                  <div className="text-lg font-semibold">{workStartTime}</div>
                </div>
              ) : null}
              <div className="flex gap-2">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="bg-white text-red-600 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Clock In/Out */}
          <Card className={isWorking ? "border-green-500 bg-green-50" : "border-orange-500 bg-orange-50"}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {isWorking ? "Jornada Activa" : "Jornada No Iniciada"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isWorking
                      ? `Comenzaste a las ${workStartTime}`
                      : "Marca tu entrada para comenzar"}
                  </p>
                </div>
                <Button
                  onClick={isWorking ? handleClockOut : handleClockIn}
                  size="lg"
                  className={isWorking ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                  <Clock className="mr-2 h-5 w-5" />
                  {isWorking ? "Marcar Salida" : "Marcar Entrada"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayTotal}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.todayCompleted} completadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.weekTotal}</div>
                <p className="text-xs text-muted-foreground">Servicios realizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.monthRevenue}</div>
                <p className="text-xs text-muted-foreground">Generados este mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas Hoy</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayCompleted}</div>
                <p className="text-xs text-muted-foreground">de {stats.todayTotal} programadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Agenda del Día</CardTitle>
              <CardDescription>Tus citas programadas para hoy</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-gray-500 py-4 text-center">Cargando agenda...</p>
              ) : appointments.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">No tenés citas para hoy</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-lg font-bold">{appt.time}</div>
                          <div className="text-xs text-gray-500">
                            {parseInt(appt.time) < 12 ? "AM" : "PM"}
                          </div>
                        </div>
                        <div className="h-12 w-px bg-gray-200" />
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold">{appt.client}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(appt.status)}`}>
                              {getStatusText(appt.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {appt.service} · <span className="font-medium">${appt.price}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {appt.status === "pending" && (
                          <Button size="sm" variant="outline" disabled={updatingId === appt.id} onClick={() => handleStatusChange(appt.id, "confirmed")}>
                            Confirmar
                          </Button>
                        )}
                        {appt.status === "confirmed" && (
                          <Button size="sm" disabled={updatingId === appt.id} onClick={() => handleStatusChange(appt.id, "in-progress")}>
                            Iniciar
                          </Button>
                        )}
                        {appt.status === "in-progress" && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={updatingId === appt.id} onClick={() => handleStatusChange(appt.id, "completed")}>
                            Completar
                          </Button>
                        )}
                        {appt.status === "completed" && (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
