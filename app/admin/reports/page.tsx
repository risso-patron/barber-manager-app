"use client"

import { useState, useMemo, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  FileText,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  Target
} from "lucide-react"

type ReportPeriod = "today" | "week" | "month" | "year"

interface ReportAppointment {
  id: string
  date: string
  status: string
  clientId: string
  employeeId: string
  employeeName: string
  serviceName: string
  price: number
  duration: number
}

interface ReportEmployee {
  id: string
  name: string
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ReportsPage() {
  useRequireAuth(["admin"])
  
  const [period, setPeriod] = useState<ReportPeriod>("month")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [appointments, setAppointments] = useState<ReportAppointment[]>([])
  const [employees, setEmployees] = useState<ReportEmployee[]>([])

  useEffect(() => {
    supabase
      .from("appointments")
      .select(`id, appointment_date, status, client_id, barber_id,
        service:services(name, price, duration),
        barber:users!appointments_barber_id_fkey(id, name)`)
      .order("appointment_date", { ascending: false })
      .then(({ data }) => {
        if (!data) return
        setAppointments((data as any[]).map(a => ({
          id: a.id,
          date: a.appointment_date,
          status: a.status,
          clientId: a.client_id,
          employeeId: a.barber_id,
          employeeName: a.barber?.name || "Sin asignar",
          serviceName: a.service?.name || "Sin servicio",
          price: a.service?.price || 0,
          duration: a.service?.duration || 0,
        })))
      })
    supabase
      .from("users")
      .select("id, name")
      .eq("role", "employee")
      .order("name")
      .then(({ data }) => {
        if (data) setEmployees(data as ReportEmployee[])
      })
  }, [])

  const filteredAppointments = useMemo(() => {
    const now = new Date()
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      
      // Filter by period
      let inPeriod = false
      switch (period) {
        case "today":
          inPeriod = aptDate.toDateString() === now.toDateString()
          break
        case "week":
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 7)
          inPeriod = aptDate >= weekAgo
          break
        case "month":
          const monthAgo = new Date(now)
          monthAgo.setMonth(now.getMonth() - 1)
          inPeriod = aptDate >= monthAgo
          break
        case "year":
          const yearAgo = new Date(now)
          yearAgo.setFullYear(now.getFullYear() - 1)
          inPeriod = aptDate >= yearAgo
          break
      }

      // Filter by employee
      const matchesEmployee = selectedEmployee === "all" || apt.employeeId === selectedEmployee

      return inPeriod && matchesEmployee
    })

    return filtered
  }, [period, selectedEmployee, appointments])

  const stats = useMemo(() => {
    const completed = filteredAppointments.filter(apt => apt.status === "completed")
    const cancelled = filteredAppointments.filter(apt => apt.status === "cancelled")
    const pending = filteredAppointments.filter(apt => apt.status === "pending")
    
    const totalRevenue = completed.reduce((sum, apt) => sum + apt.price, 0)
    const averageTicket = completed.length > 0 ? totalRevenue / completed.length : 0
    
    const totalDuration = completed.reduce((sum, apt) => sum + apt.duration, 0)
    const averageDuration = completed.length > 0 ? totalDuration / completed.length : 0

    // Service popularity
    const serviceStats = completed.reduce((acc, apt) => {
      const serviceName = apt.serviceName
      if (!acc[serviceName]) {
        acc[serviceName] = { count: 0, revenue: 0 }
      }
      acc[serviceName].count++
      acc[serviceName].revenue += apt.price
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    const topServices = Object.entries(serviceStats)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)

    // Employee performance
    const employeeStats = completed.reduce((acc, apt) => {
      const employeeName = apt.employeeName
      if (!acc[employeeName]) {
        acc[employeeName] = { count: 0, revenue: 0 }
      }
      acc[employeeName].count++
      acc[employeeName].revenue += apt.price
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    const topEmployees = Object.entries(employeeStats)
      .sort((a, b) => b[1].revenue - a[1].revenue)

    // Client stats
    const uniqueClients = new Set(completed.map(apt => apt.clientId)).size
    const repeatClients = completed.reduce((acc, apt) => {
      acc[apt.clientId] = (acc[apt.clientId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const clientsWithMultipleVisits = Object.values(repeatClients).filter(count => count > 1).length

    // Daily distribution
    const dailyRevenue = completed.reduce((acc, apt) => {
      const date = apt.date
      acc[date] = (acc[date] || 0) + apt.price
      return acc
    }, {} as Record<string, number>)

    const bestDay = Object.entries(dailyRevenue)
      .sort((a, b) => b[1] - a[1])[0]

    // Datos para gráfico de ingresos diarios (últimos 14 días del período)
    const dailyMap = completed.reduce((acc, apt) => {
      acc[apt.date] = (acc[apt.date] || 0) + apt.price
      return acc
    }, {} as Record<string, number>)

    const dailyChartData = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
        fullDate: date,
        ingresos: revenue,
      }))

    // Datos para gráfico de torta de servicios
    const serviceChartData = topServices.map(([name, data], i) => ({
      name: name.length > 14 ? name.slice(0, 14) + "…" : name,
      value: data.revenue,
      count: data.count,
    }))

    return {
      totalAppointments: filteredAppointments.length,
      completed: completed.length,
      cancelled: cancelled.length,
      pending: pending.length,
      totalRevenue,
      averageTicket,
      averageDuration,
      topServices,
      topEmployees,
      uniqueClients,
      clientsWithMultipleVisits,
      retentionRate: uniqueClients > 0 ? (clientsWithMultipleVisits / uniqueClients) * 100 : 0,
      completionRate: filteredAppointments.length > 0 ? (completed.length / filteredAppointments.length) * 100 : 0,
      cancellationRate: filteredAppointments.length > 0 ? (cancelled.length / filteredAppointments.length) * 100 : 0,
      bestDay,
      dailyChartData,
      serviceChartData,
    }
  }, [filteredAppointments])

  const handleExportExcel = () => {
    const rows = [
      ["Fecha", "Estado", "Empleado", "Servicio", "Precio", "Duración (min)", "Cliente ID"],
      ...filteredAppointments.map(apt => [
        apt.date,
        apt.status,
        apt.employeeName,
        apt.serviceName,
        apt.price.toFixed(2),
        apt.duration,
        apt.clientId,
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-${getPeriodLabel().toLowerCase().replace(/ /g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    window.print()
  }

  const getPeriodLabel = () => {
    switch (period) {
      case "today": return "Hoy"
      case "week": return "Última Semana"
      case "month": return "Último Mes"
      case "year": return "Último Año"
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
          <p className="text-muted-foreground">Visualiza métricas y estadísticas del negocio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileText className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <Button
                variant={period === "today" ? "default" : "outline"}
                onClick={() => setPeriod("today")}
                size="sm"
              >
                Hoy
              </Button>
              <Button
                variant={period === "week" ? "default" : "outline"}
                onClick={() => setPeriod("week")}
                size="sm"
              >
                Semana
              </Button>
              <Button
                variant={period === "month" ? "default" : "outline"}
                onClick={() => setPeriod("month")}
                size="sm"
              >
                Mes
              </Button>
              <Button
                variant={period === "year" ? "default" : "outline"}
                onClick={() => setPeriod("year")}
                size="sm"
              >
                Año
              </Button>
            </div>
            
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Todos los empleados</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Métricas Clave - {getPeriodLabel()}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Ticket promedio: ${stats.averageTicket.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Citas Completadas</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completionRate.toFixed(1)}% tasa de finalización
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueClients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.retentionRate.toFixed(1)}% tasa de retención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageDuration.toFixed(0)} min</div>
              <p className="text-xs text-muted-foreground">
                Por servicio
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Gráfico ingresos diarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Ingresos Diarios
            </CardTitle>
            <CardDescription>Últimas fechas del período seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.dailyChartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Ingresos"]} />
                  <Bar dataKey="ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sin datos en este período</p>
            )}
          </CardContent>
        </Card>

        {/* Gráfico distribución servicios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              Distribución de Servicios
            </CardTitle>
            <CardDescription>Por ingresos generados</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.serviceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.serviceChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.serviceChartData.map((_, i) => (
                      <Cell key={i} fill={["#6366f1","#22c55e","#f59e0b","#ef4444","#8b5cf6"][i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Ingresos"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sin datos en este período</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              Servicios Más Vendidos
            </CardTitle>
            <CardDescription>Por ingresos generados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topServices.map(([service, data], index) => (
                <div key={service} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{service}</p>
                      <p className="text-xs text-muted-foreground">{data.count} servicios</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${data.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {stats.topServices.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Rendimiento de Empleados
            </CardTitle>
            <CardDescription>Por ingresos generados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topEmployees.map(([employee, data], index) => (
                <div key={employee} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{employee}</p>
                      <p className="text-xs text-muted-foreground">{data.count} servicios</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${data.revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      ${(data.revenue / data.count).toFixed(2)} promedio
                    </p>
                  </div>
                </div>
              ))}
              {stats.topEmployees.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Tasa de Finalización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Completadas</span>
                <span className="font-medium text-green-600">{stats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Canceladas</span>
                <span className="font-medium text-red-600">{stats.cancelled}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pendientes</span>
                <span className="font-medium text-yellow-600">{stats.pending}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{stats.totalAppointments}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  Tasa de finalización: <span className="font-bold">{stats.completionRate.toFixed(1)}%</span>
                </p>
                <p className="text-sm text-red-900 mt-1">
                  Tasa de cancelación: <span className="font-bold">{stats.cancellationRate.toFixed(1)}%</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Retención de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Clientes únicos</p>
                <p className="text-3xl font-bold">{stats.uniqueClients}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes recurrentes</p>
                <p className="text-3xl font-bold">{stats.clientsWithMultipleVisits}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Tasa de retención</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.retentionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              Mejor Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.bestDay ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="text-lg font-semibold">
                      {new Date(stats.bestDay[0]).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos generados</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${stats.bestDay[1].toFixed(2)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay datos disponibles
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Ejecutivo</CardTitle>
          <CardDescription>Análisis general del período seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Puntos Positivos
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✅ Tasa de finalización de {stats.completionRate.toFixed(1)}%</li>
                <li>✅ {stats.uniqueClients} clientes únicos atendidos</li>
                <li>✅ Ticket promedio de ${stats.averageTicket.toFixed(2)}</li>
                <li>✅ {stats.retentionRate.toFixed(1)}% de retención de clientes</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Áreas de Mejora
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {stats.cancellationRate > 10 && (
                  <li>⚠️ Reducir tasa de cancelación ({stats.cancellationRate.toFixed(1)}%)</li>
                )}
                {stats.retentionRate < 50 && (
                  <li>⚠️ Mejorar retención de clientes ({stats.retentionRate.toFixed(1)}%)</li>
                )}
                {stats.pending > 5 && (
                  <li>⚠️ {stats.pending} citas pendientes por confirmar</li>
                )}
                <li>📈 Oportunidad de aumentar ticket promedio</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
