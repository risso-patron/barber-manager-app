export type UserRole = "client" | "employee" | "secretary" | "admin"

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  avatar_url?: string
  is_active?: boolean
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

// Financial transactions
export type TransactionType = "income" | "expense"
export type TransactionCategory = 
  | "service" 
  | "product_sale" 
  | "salary" 
  | "supplies" 
  | "rent" 
  | "utilities" 
  | "other"

export interface FinancialTransaction {
  id: string
  transaction_type: TransactionType
  category: TransactionCategory
  amount: number
  description?: string
  reference_id?: string
  payment_method?: "cash" | "card" | "transfer" | "other"
  created_by: string
  transaction_date: string
  created_at: string
}

// Employee commissions
export interface EmployeeCommission {
  id: string
  employee_id: string
  appointment_id?: string
  amount: number
  commission_rate?: number
  payment_status: "pending" | "paid"
  payment_date?: string
  notes?: string
  created_at: string
}

// Customer loyalty
export interface CustomerLoyalty {
  id: string
  client_id: string
  points: number
  total_spent: number
  last_visit?: string
  created_at: string
  updated_at: string
}

// Lockup types
export type LockupKind = "basic" | "premium"
export type LockupType = "typeA" | "typeB"
