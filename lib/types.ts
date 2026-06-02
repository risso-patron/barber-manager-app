export type UserRole = "client" | "employee" | "admin"

export type EmployeeSpecialty = "barbero" | "cajero" | "recepcionista" | "gerente"

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  specialty?: EmployeeSpecialty | null
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  is_active: boolean
  created_at: string
}

export interface Appointment {
  id: string
  client_id: string
  barber_id: string
  service_id: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  notes?: string
  feedback?: string
  rating?: number
  created_at: string
  updated_at: string
  client?: User
  barber?: User
  service?: Service
}

export interface InventoryItem {
  id: string
  product_name: string
  quantity: number
  min_stock: number
  supplier?: string
  cost_per_unit?: number
  created_at: string
  updated_at: string
}

export interface InventoryMovement {
  id: string
  inventory_id: string
  movement_type: "in" | "out" | "adjustment"
  quantity: number
  reason?: string
  created_by: string
  created_at: string
}

export interface TimeLog {
  id: string
  employee_id: string
  date: string
  time_in?: string
  time_out?: string
  break_start?: string
  break_end?: string
  total_hours?: number
  created_at: string
}

export type ReportStats = {
  totalRevenue: number
  completed: number
  cancelled: number
  pending: number
  totalClients: number
  totalAppointments: number
  dailyChartData: Array<{ date: string; revenue: number; count: number }>
  statusChartData: Array<{ name: string; value: number }>
  employeeChartData: Array<{ name: string; revenue: number; count: number }>
  serviceChartData: Array<{ name: string; value: number }>
  trendData: Array<{ label: string; ingresos: number }>
  previousTotalRevenue: number
  revenueChange: number
  previousCompleted: number
  completedChange: number
}
