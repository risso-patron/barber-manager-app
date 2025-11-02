import { createClient } from '@/lib/supabase/client'
import type { 
  FinancialTransaction, 
  EmployeeCommission,
  InventoryItem,
  Appointment,
  Service,
  User
} from '@/lib/types'

const supabase = createClient()

// ============================================
// FINANCIAL TRANSACTIONS (Contabilidad)
// ============================================

export const getMonthlyIncome = async (year: number, month: number) => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('transaction_type', 'income')
    .gte('transaction_date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lte('transaction_date', `${year}-${String(month).padStart(2, '0')}-31`)
    .order('transaction_date', { ascending: false })

  if (error) throw error
  return data as FinancialTransaction[]
}

export const getMonthlyExpenses = async (year: number, month: number) => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('transaction_type', 'expense')
    .gte('transaction_date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lte('transaction_date', `${year}-${String(month).padStart(2, '0')}-31`)
    .order('transaction_date', { ascending: false })

  if (error) throw error
  return data as FinancialTransaction[]
}

export const createTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert(transaction)
    .select()
    .single()

  if (error) throw error
  return data as FinancialTransaction
}

// ============================================
// EMPLOYEE COMMISSIONS (Comisiones)
// ============================================

export const getEmployeeCommissions = async (employeeId: string, status?: 'pending' | 'paid') => {
  let query = supabase
    .from('employee_commissions')
    .select('*, employee:users!employee_id(*), appointment:appointments(*)')
    .eq('employee_id', employeeId)

  if (status) {
    query = query.eq('payment_status', status)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const markCommissionsAsPaid = async (commissionIds: string[]) => {
  const { data, error } = await supabase
    .from('employee_commissions')
    .update({ 
      payment_status: 'paid', 
      payment_date: new Date().toISOString().split('T')[0] 
    })
    .in('id', commissionIds)
    .select()

  if (error) throw error
  return data
}

// ============================================
// INVENTORY (Inventario)
// ============================================

export const getLowStockItems = async () => {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .filter('quantity', 'lte', 'min_stock')
    .order('quantity', { ascending: true })

  if (error) throw error
  return data as InventoryItem[]
}

export const updateInventoryQuantity = async (itemId: string, quantity: number, reason: string, userId: string) => {
  // Update inventory
  const { data: inventoryData, error: inventoryError } = await supabase
    .from('inventory')
    .update({ quantity })
    .eq('id', itemId)
    .select()
    .single()

  if (inventoryError) throw inventoryError

  // Create movement record
  const { data: movementData, error: movementError } = await supabase
    .from('inventory_movements')
    .insert({
      inventory_id: itemId,
      movement_type: 'adjustment',
      quantity,
      reason,
      created_by: userId
    })

  if (movementError) throw movementError

  return { inventory: inventoryData, movement: movementData }
}

// ============================================
// APPOINTMENTS (Citas)
// ============================================

export const getTodayAppointments = async () => {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:users!client_id(*),
      barber:users!barber_id(*),
      service:services(*)
    `)
    .eq('appointment_date', today)
    .in('status', ['pending', 'confirmed'])
    .order('appointment_time', { ascending: true })

  if (error) throw error
  return data
}

export const getUpcomingAppointments = async (days: number = 7) => {
  const today = new Date().toISOString().split('T')[0]
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)
  const futureDateStr = futureDate.toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:users!client_id(*),
      barber:users!barber_id(*),
      service:services(*)
    `)
    .gte('appointment_date', today)
    .lte('appointment_date', futureDateStr)
    .in('status', ['pending', 'confirmed'])
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  if (error) throw error
  return data
}

export const createAppointment = async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointment)
    .select(`
      *,
      client:users!client_id(*),
      barber:users!barber_id(*),
      service:services(*)
    `)
    .single()

  if (error) throw error
  return data
}

export const updateAppointmentStatus = async (appointmentId: string, status: Appointment['status']) => {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// USERS (Usuarios)
// ============================================

export const getEmployees = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'employee')
    .order('name', { ascending: true })

  if (error) throw error
  return data as User[]
}

export const getClients = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'client')
    .order('name', { ascending: true })

  if (error) throw error
  return data as User[]
}

// ============================================
// SERVICES (Servicios)
// ============================================

export const getActiveServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) throw error
  return data as Service[]
}

// ============================================
// DASHBOARD STATS (Estadísticas)
// ============================================

export const getDashboardStats = async () => {
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  // Today's appointments
  const { count: todayAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('appointment_date', today)
    .in('status', ['pending', 'confirmed'])

  // This month's income
  const { data: monthlyIncome } = await supabase
    .from('financial_transactions')
    .select('amount')
    .eq('transaction_type', 'income')
    .gte('transaction_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)

  const totalIncome = monthlyIncome?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

  // Pending commissions
  const { data: pendingCommissions } = await supabase
    .from('employee_commissions')
    .select('amount')
    .eq('payment_status', 'pending')

  const totalPendingCommissions = pendingCommissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0

  // Low stock items count
  const { data: lowStockData } = await supabase
    .from('inventory')
    .select('quantity, min_stock')

  const lowStockCount = lowStockData?.filter(item => item.quantity <= item.min_stock).length || 0

  return {
    todayAppointments: todayAppointments || 0,
    monthlyIncome: totalIncome,
    pendingCommissions: totalPendingCommissions,
    lowStockItems: lowStockCount
  }
}
