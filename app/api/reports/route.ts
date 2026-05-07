import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { ReportStats } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Missing date parameters" }, { status: 400 })
    }

    // Obtener citas del período actual
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(
        `
        id,
        status,
        appointment_date,
        appointment_time,
        service_id,
        barber_id,
        client_id,
        services(price),
        users!barber_id(name),
        users!client_id(id)
      `
      )
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)

    if (appointmentsError) throw appointmentsError

    // Obtener citas del período anterior (para comparativa)
    const currentStartDate = new Date(startDate)
    const currentEndDate = new Date(endDate)
    const daysDiff = (currentEndDate.getTime() - currentStartDate.getTime()) / (1000 * 60 * 60 * 24)

    const prevStartDate = new Date(currentStartDate.getTime() - daysDiff * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
    const prevEndDate = new Date(currentStartDate.getTime() - 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    const { data: prevAppointments } = await supabase
      .from("appointments")
      .select(
        `
        id,
        status,
        appointment_date,
        service_id,
        services(price)
      `
      )
      .gte("appointment_date", prevStartDate)
      .lte("appointment_date", prevEndDate)

    // Calcular estadísticas básicas
    const completed = (appointments || []).filter((a) => a.status === "completed").length
    const cancelled = (appointments || []).filter((a) => a.status === "cancelled").length
    const pending = (appointments || []).filter((a) => a.status === "pending").length
    const confirmed = (appointments || []).filter((a) => a.status === "confirmed").length

    const totalRevenue = (appointments || [])
      .filter((a) => a.status === "completed")
      .reduce((sum: number, a: any) => sum + (a.services?.price || 0), 0)

    const totalClients = new Set((appointments || []).map((a) => a.client_id)).size
    const totalAppointments = appointments?.length || 0

    // Calcular datos para gráfico diario
    const dailyData: Record<string, { revenue: number; count: number }> = {}
    ;(appointments || []).forEach((apt: any) => {
      const date = apt.appointment_date
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, count: 0 }
      }
      if (apt.status === "completed") {
        dailyData[date].revenue += apt.services?.price || 0
      }
      dailyData[date].count += 1
    })

    const dailyChartData = Object.entries(dailyData)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
        ...data,
      }))

    // Calcular datos para gráfico de estado
    const statusChartData = [
      { name: "Completadas", value: completed },
      { name: "Confirmadas", value: confirmed },
      { name: "Pendientes", value: pending },
      { name: "Canceladas", value: cancelled },
    ].filter((item) => item.value > 0)

    // Calcular datos para gráfico de empleados
    const employeeData: Record<string, { revenue: number; count: number }> = {}
    ;(appointments || []).forEach((apt: any) => {
      const barberName = apt.users?.name || "Sin asignar"
      if (!employeeData[barberName]) {
        employeeData[barberName] = { revenue: 0, count: 0 }
      }
      if (apt.status === "completed") {
        employeeData[barberName].revenue += apt.services?.price || 0
      }
      employeeData[barberName].count += 1
    })

    const employeeChartData = Object.entries(employeeData)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        ...data,
      }))

    // Calcular datos para gráfico de servicios
    const { data: services } = await supabase.from("services").select("id, name, price")

    const serviceData: Record<string, number> = {}
    ;(appointments || []).forEach((apt: any) => {
      const service = services?.find((s: any) => s.id === apt.service_id)
      const serviceName = service?.name || "Desconocido"
      if (apt.status === "completed") {
        serviceData[serviceName] = (serviceData[serviceName] || 0) + (service?.price || 0)
      }
    })

    const serviceChartData = Object.entries(serviceData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({
        name,
        value,
      }))

    // Calcular tendencia (por semana o período)
    const trendData: Array<{ label: string; ingresos: number }> = []
    const weeks: Record<string, number> = {}

    ;(appointments || []).forEach((apt: any) => {
      const date = new Date(apt.appointment_date)
      const weekNum = Math.ceil((date.getDate() - date.getDay()) / 7)
      const monthYear = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" })
      const weekLabel = `Sem ${weekNum} ${monthYear}`

      if (apt.status === "completed") {
        weeks[weekLabel] = (weeks[weekLabel] || 0) + (apt.services?.price || 0)
      }
    })

    Object.entries(weeks).forEach(([label, ingresos]) => {
      trendData.push({ label, ingresos })
    })

    // Calcular estadísticas del período anterior
    const previousCompleted = (prevAppointments || []).filter(
      (a) => a.status === "completed"
    ).length
    const previousRevenue = (prevAppointments || [])
      .filter((a) => a.status === "completed")
      .reduce((sum: number, a: any) => sum + (a.services?.price || 0), 0)

    const revenueChange =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : totalRevenue > 0
          ? 100
          : 0

    const completedChange =
      previousCompleted > 0
        ? ((completed - previousCompleted) / previousCompleted) * 100
        : completed > 0
          ? 100
          : 0

    const stats: ReportStats = {
      totalRevenue,
      completed,
      cancelled,
      pending,
      totalClients,
      totalAppointments,
      dailyChartData,
      statusChartData,
      employeeChartData,
      serviceChartData,
      trendData,
      previousTotalRevenue: previousRevenue,
      revenueChange,
      previousCompleted,
      completedChange,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}
