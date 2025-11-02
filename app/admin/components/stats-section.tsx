import { StatCard } from "./stat-card"

interface StatsSectionProps {
  stats: {
    todayAppointments: number
    monthlyRevenue: number
    totalClients: number
    barbers: number
  }
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      <StatCard
        icon="📅"
        title="Citas Hoy"
        value={stats.todayAppointments}
        subtitle="Programadas para hoy"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      />
      
      <StatCard
        icon="💰"
        title="Ingresos del Mes"
        value={`$${stats.monthlyRevenue.toLocaleString()}`}
        subtitle="Servicios completados"
        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
      />
      
      <StatCard
        icon="👥"
        title="Total Clientes"
        value={stats.totalClients}
        subtitle="Clientes registrados"
        gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
      />
      
      <StatCard
        icon="💼"
        title="Barberos Activos"
        value={stats.barbers}
        subtitle="Barberos trabajando"
        gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
      />
    </div>
  )
}
