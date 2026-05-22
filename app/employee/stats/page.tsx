"use client"

import { useMemo, useState, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
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

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mis Estadísticas</h1>
        <p className="text-muted-foreground">Análisis de tu rendimiento y desempeño</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Total histórico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Generados</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              Ticket promedio: ${stats.avgTicket.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueClients}</div>
            <p className="text-xs text-muted-foreground">
              Clientes únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {stats.avgRating !== null ? (
              <>
                <div className="text-2xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)} ★</div>
                <p className="text-xs text-muted-foreground">
                  Basado en {stats.ratedCount} calificación{stats.ratedCount !== 1 ? "es" : ""}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground">Sin calificaciones aún</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Finalización</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Servicios completados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.todayAppts}</div>
            <p className="text-sm text-muted-foreground mt-1">Citas programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.weekAppts}</div>
            <p className="text-sm text-muted-foreground mt-1">Servicios realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.monthAppts}</div>
            <p className="text-sm text-muted-foreground mt-1">Total del mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de servicios */}
      {stats.chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Servicios por Ingresos
            </CardTitle>
            <CardDescription>Top servicios completados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "ingresos" ? [`$${value.toFixed(2)}`, "Ingresos"] : [value, "Servicios"]
                  }
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? label}
                />
                <Bar dataKey="ingresos" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Servicios Más Realizados
            </CardTitle>
            <CardDescription>Tus especialidades más solicitadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topServices.length > 0 ? (
                stats.topServices.map(([service, data], index) => (
                  <div key={service} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{service}</p>
                        <p className="text-xs text-muted-foreground">{data.count} veces</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${data.revenue.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        ${(data.revenue / data.count).toFixed(2)} c/u
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay servicios completados aún
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Best Day */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Mejor Día de la Semana
            </CardTitle>
            <CardDescription>Tu día más productivo</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.bestDay ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground">Día</p>
                  <p className="text-3xl font-bold capitalize">{stats.bestDay[0]}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Servicios</p>
                    <p className="text-2xl font-bold">{stats.bestDay[1].count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${stats.bestDay[1].revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Promedio: ${(stats.bestDay[1].revenue / stats.bestDay[1].count).toFixed(2)} por servicio
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay datos suficientes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feedback Reciente */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            Feedback de Clientes
          </CardTitle>
          <CardDescription>
            {stats.feedbackCount} comentario{stats.feedbackCount !== 1 ? "s" : ""} registrado{stats.feedbackCount !== 1 ? "s" : ""}
            {stats.feedbackCount > 0 && ` • ${stats.positiveFeedbackRate.toFixed(1)}% positivo`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentFeedbacks.length > 0 ? (
            <div className="space-y-3">
              {stats.recentFeedbacks.map((apt) => (
                <div key={apt.id} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="font-medium">{apt.clientName || "Cliente"}</p>
                    <div className="text-xs text-muted-foreground">
                      {new Date(apt.date).toLocaleDateString("es-ES")}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{apt.serviceName}</p>
                  <p className="text-sm">{apt.feedback}</p>
                  {apt.rating !== null && apt.rating !== undefined && apt.rating > 0 && (
                    <p className="text-xs text-yellow-700 mt-2">⭐ {apt.rating.toFixed(1)} / 5</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay feedback registrado todavía</p>
          )}
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            Resumen de Rendimiento
          </CardTitle>
          <CardDescription>Tu desempeño general</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Eficiencia</p>
                  <p className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Tasa de finalización de servicios
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clientes</p>
                  <p className="text-2xl font-bold">{stats.uniqueClients}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Clientes únicos atendidos
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                  <p className="text-2xl font-bold">${stats.avgTicket.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Ingreso promedio por servicio
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Logros Destacados
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>✅ {stats.totalCompleted} servicios completados exitosamente</li>
              <li>✅ ${stats.totalRevenue} en ingresos generados</li>
              <li>✅ {stats.uniqueClients} clientes satisfechos</li>
              {stats.avgRating !== null && (
                <li>⭐ Calificación promedio: {stats.avgRating.toFixed(1)}/5 ({stats.ratedCount} reseñas)</li>
              )}
              {stats.completionRate >= 90 && (
                <li>🏆 Excelente tasa de finalización ({stats.completionRate.toFixed(1)}%)</li>
              )}
              {stats.avgTicket >= 25 && (
                <li>💰 Ticket promedio superior al esperado</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
