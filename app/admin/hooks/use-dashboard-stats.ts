import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface DashboardStats {
  todayAppointments: number
  monthlyRevenue: number
  totalClients: number
  activeEmployees: number
}

interface RecentAppointment {
  id: string
  client_name: string
  service_name: string
  appointment_date: string
  status: string
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    monthlyRevenue: 0,
    totalClients: 0,
    activeEmployees: 0
  })
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Verificar autenticación
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('No autenticado')
      }

      // Obtener estadísticas
      const today = new Date().toISOString().split('T')[0]
      
      // Citas de hoy
      const { count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', today)
        .lt('appointment_date', new Date(Date.now() + 86400000).toISOString().split('T')[0])

      // Ingresos del mes
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0]
      
      const { data: monthlyAppointments } = await supabase
        .from('appointments')
        .select('service:services(price)')
        .eq('status', 'completed')
        .gte('appointment_date', firstDayOfMonth)

      const monthlyRevenue = monthlyAppointments?.reduce((sum, apt: any) => {
        return sum + (apt.service?.price || 0)
      }, 0) || 0

      // Total de clientes
      const { count: clientsCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'client')

      // Empleados activos
      const { count: employeesCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'employee')

      setStats({
        todayAppointments: todayCount || 0,
        monthlyRevenue: monthlyRevenue,
        totalClients: clientsCount || 0,
        activeEmployees: employeesCount || 0
      })

      // Citas recientes (últimas 10)
      const { data: appointments, error: aptsError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          client:users!appointments_client_id_fkey(name),
          service:services(name)
        `)
        .order('appointment_date', { ascending: false })
        .limit(10)

      if (aptsError) throw aptsError

      const formattedAppointments = appointments?.map((apt: any) => ({
        id: apt.id,
        client_name: apt.client?.name || 'Sin nombre',
        service_name: apt.service?.name || 'Sin servicio',
        appointment_date: apt.appointment_date,
        status: apt.status
      })) || []

      setRecentAppointments(formattedAppointments)
    } catch (err: any) {
      console.error('Error loading dashboard:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  return {
    stats,
    recentAppointments,
    loading,
    error,
    refresh: loadDashboardData
  }
}
