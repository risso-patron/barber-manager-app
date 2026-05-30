"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
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
  LineChart,
  Line,
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

interface DbAppointmentRow {
  id: string
  appointment_date: string
  status: string
  client_id: string
  barber_id: string
  service: { name: string; price: number; duration: number } | null
  barber: { id: string; name: string } | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

export default function ReportsPage() {
  useRequireAuth(["admin"])
  
  const [period, setPeriod] = useState<ReportPeriod>("month")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [appointments, setAppointments] = useState<ReportAppointment[]>([])
  const [employees, setEmployees] = useState<ReportEmployee[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  const fetchReportData = useCallback(async (backgroundSync = false) => {
    if (!supabase) {
      setLastSyncedAt(new Date())
      return
    }

    if (!backgroundSync) {
      setIsSyncing(true)
    }

    const [appointmentsResult, employeesResult] = await Promise.all([
      supabase
        .from("appointments")
        .select(`id, appointment_date, status, client_id, barber_id,
          service:services(name, price, duration),
          barber:users!appointments_barber_id_fkey(id, name)`)
        .order("appointment_date", { ascending: false }),
      supabase
        .from("users")
        .select("id, name")
        .eq("role", "employee")
        .order("name"),
    ])

    if (appointmentsResult.data) {
      setAppointments(
        (appointmentsResult.data as unknown as DbAppointmentRow[]).map((a) => ({
          id: a.id,
          date: a.appointment_date,
          status: a.status,
          clientId: a.client_id,
          employeeId: a.barber_id,
          employeeName: a.barber?.name || "Sin asignar",
          serviceName: a.service?.name || "Sin servicio",
          price: a.service?.price || 0,
          duration: a.service?.duration || 0,
        }))
      )
    }

    if (employeesResult.data) {
      setEmployees(employeesResult.data as ReportEmployee[])
    }

    setLastSyncedAt(new Date())
    setIsSyncing(false)
  }, [])

  useEffect(() => {
    void fetchReportData()
    if (!supabase) return

    const channel = supabase
      .channel("reports-admin-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          void fetchReportData(true)
        }
      )
      .subscribe()

    const syncInterval = setInterval(() => {
      void fetchReportData(true)
    }, 30000)

    return () => {
      clearInterval(syncInterval)
      void supabase.removeChannel(channel)
    }
  }, [fetchReportData])

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

  // Helper para calcular rango de fechas según período
  const getDateRange = (offset = 0) => {
    const now = new Date()
    let start = new Date()
    let end = now

    switch (period) {
      case "today":
        start = new Date(now)
        start.setDate(now.getDate() - offset)
        end = new Date(start)
        break
      case "week":
        start.setDate(now.getDate() - 7 - offset * 7)
        end.setDate(now.getDate() - offset * 7 - 1)
        break
      case "month":
        start.setMonth(now.getMonth() - offset - 1)
        start.setDate(1)
        end.setDate(0)
        break
      case "year":
        start.setFullYear(now.getFullYear() - offset - 1)
        start.setMonth(0)
        start.setDate(1)
        end.setFullYear(now.getFullYear() - offset)
        end.setMonth(0)
        end.setDate(0)
        break
    }

    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
  }

  // Calcular stats para período anterior
  const previousPeriodAppointments = useMemo(() => {
    const { start, end } = getDateRange(1)
    return appointments.filter(apt => {
      const aptDate = apt.date
      const matchesEmployee = selectedEmployee === "all" || apt.employeeId === selectedEmployee
      return aptDate >= start && aptDate <= end && matchesEmployee
    })
  }, [period, selectedEmployee, appointments]) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    // Función para calcular stats de un grupo de appointments
    const calculateMetrics = (appts: ReportAppointment[]) => {
      const completed = appts.filter(apt => apt.status === "completed")
      const totalRevenue = completed.reduce((sum, apt) => sum + apt.price, 0)
      const averageTicket = completed.length > 0 ? totalRevenue / completed.length : 0
      return {
        completed: completed.length,
        totalRevenue,
        averageTicket,
      }
    }

    // Stats período actual
    const currentMetrics = calculateMetrics(filteredAppointments)

    // Stats período anterior
    const previousMetrics = calculateMetrics(previousPeriodAppointments)

    // Calcular cambios %
    const revenueChange = previousMetrics.totalRevenue > 0
      ? ((currentMetrics.totalRevenue - previousMetrics.totalRevenue) / previousMetrics.totalRevenue) * 100
      : 0
    const completedChange = previousMetrics.completed > 0
      ? ((currentMetrics.completed - previousMetrics.completed) / previousMetrics.completed) * 100
      : 0

    // Resto de stats
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

    // Gráfico de tendencia temporal (últimos N períodos)
    const trendData = []
    const numPeriods = period === "year" ? 12 : period === "month" ? 4 : period === "week" ? 4 : 7
    for (let i = numPeriods - 1; i >= 0; i--) {
      const { start, end } = getDateRange(i)
      const periodAppts = appointments.filter(apt => {
        const aptDate = apt.date
        const matchesEmployee = selectedEmployee === "all" || apt.employeeId === selectedEmployee
        return aptDate >= start && aptDate <= end && matchesEmployee
      })
      const periodCompleted = periodAppts.filter(apt => apt.status === "completed")
      const periodRevenue = periodCompleted.reduce((sum, apt) => sum + apt.price, 0)
      
      let label = ""
      if (period === "year") {
        const year = new Date(start).getFullYear()
        const month = new Date(start).getMonth() + 1
        label = `${month.toString().padStart(2, "0")}/${year}`
      } else if (period === "month") {
        const date = new Date(start)
        label = `Sem ${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`
      } else {
        const date = new Date(start)
        label = date.toLocaleDateString("es-ES", { month: "short", day: "2-digit" })
      }

      trendData.push({
        label,
        ingresos: periodRevenue,
        citas: periodCompleted.length,
      })
    }

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
    const serviceChartData = topServices.map(([name, data], _i) => ({
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
      trendData,
      revenueChange,
      completedChange,
      previousTotalRevenue: previousMetrics.totalRevenue,
      previousCompleted: previousMetrics.completed,
    }
  }, [filteredAppointments, previousPeriodAppointments, period, selectedEmployee, appointments]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportExcel = async () => {
    const XLSX = await import("xlsx")

    const reportRows = filteredAppointments.map((apt) => ({
      Fecha: apt.date,
      Estado: apt.status,
      Empleado: apt.employeeName,
      Servicio: apt.serviceName,
      Precio: Number(apt.price.toFixed(2)),
      "Duracion (min)": apt.duration,
      "Cliente ID": apt.clientId,
    }))

    const worksheet = XLSX.utils.json_to_sheet(reportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte")
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [["Periodo", getPeriodLabel()], ["Generado", new Date().toLocaleString("es-ES")]],
      { origin: "J1" }
    )

    XLSX.writeFile(
      workbook,
      `reporte-${getPeriodLabel().toLowerCase().replace(/ /g, "-")}-${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")

    const doc = new jsPDF({ orientation: "landscape" })
    doc.setFontSize(16)
    doc.text("Reporte de Ornō", 14, 16)
    doc.setFontSize(11)
    doc.text(`Periodo: ${getPeriodLabel()}`, 14, 24)
    doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, 14, 30)
    doc.text(`Ingresos: $${stats.totalRevenue.toFixed(2)} | Completadas: ${stats.completed}`, 14, 36)

    autoTable(doc, {
      startY: 42,
      head: [["Fecha", "Estado", "Empleado", "Servicio", "Precio", "Duracion (min)", "Cliente ID"]],
      body: filteredAppointments.map((apt) => [
        apt.date,
        apt.status,
        apt.employeeName,
        apt.serviceName,
        `$${apt.price.toFixed(2)}`,
        String(apt.duration),
        apt.clientId,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94] },
    })

    doc.save(`reporte-${getPeriodLabel().toLowerCase().replace(/ /g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`)
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
          <p className="text-xs text-muted-foreground mt-1">
            {isSyncing ? "Sincronizando datos..." : "Actualización automática cada 30s"}
            {lastSyncedAt ? ` • Última sincronización: ${lastSyncedAt.toLocaleTimeString("es-ES")}` : ""}
          </p>
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

        {/* Gráfico de distribución servicios */}
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

      {/* Gráfico de tendencia temporal */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Tendencia de Ingresos
          </CardTitle>
          <CardDescription>Últimos períodos comparados</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.trendData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Ingresos"]} />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">Sin datos en este período</p>
          )}
        </CardContent>
      </Card>

      {/* Comparativas período anterior */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Comparativa de Ingresos
            </CardTitle>
            <CardDescription>Actual vs. período anterior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Período actual</p>
                <p className="text-3xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Período anterior</p>
                <p className="text-3xl font-bold text-gray-600">${stats.previousTotalRevenue.toFixed(2)}</p>
              </div>
              <div className={`p-3 rounded-lg ${stats.revenueChange >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <p className={`text-sm font-semibold ${stats.revenueChange >= 0 ? "text-green-900" : "text-red-900"}`}>
                  {stats.revenueChange >= 0 ? "📈" : "📉"} Cambio: {stats.revenueChange.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Comparativa de Citas
            </CardTitle>
            <CardDescription>Actual vs. período anterior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Citas completadas</p>
                <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Período anterior</p>
                <p className="text-3xl font-bold text-gray-600">{stats.previousCompleted}</p>
              </div>
              <div className={`p-3 rounded-lg ${stats.completedChange >= 0 ? "bg-blue-50 border border-blue-200" : "bg-orange-50 border border-orange-200"}`}>
                <p className={`text-sm font-semibold ${stats.completedChange >= 0 ? "text-blue-900" : "text-orange-900"}`}>
                  {stats.completedChange >= 0 ? "📈" : "📉"} Cambio: {stats.completedChange.toFixed(1)}%
                </p>
              </div>
            </div>
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
