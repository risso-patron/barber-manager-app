// Demo data for appointments management
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  employeeId: string
  employeeName: string
  serviceId: string
  serviceName: string
  date: string
  time: string
  duration: number // in minutes
  price: number
  status: AppointmentStatus
  notes?: string
  rating?: number
  createdAt: string
}

export interface Service {
  id: string
  name: string
  duration: number // in minutes
  price: number
  description?: string
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  role: "employee"
  avatar?: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  createdAt?: string
  isActive?: boolean
  birthday?: string | null
  allergies?: string | null
  marketingConsent?: boolean
  preferredEmployeeId?: string | null
}

export interface InventoryItem {
  id: string
  name: string
  category: 'producto' | 'herramienta' | 'suministro'
  quantity: number
  minStock: number
  price: number
  salePrice?: number | null
  sku?: string | null
  supplier?: string
  lastRestocked?: string
  status?: 'disponible' | 'bajo' | 'agotado'
}

// Demo Services
export const DEMO_SERVICES: Service[] = [
  { id: "s1", name: "Corte Clásico", duration: 30, price: 15, description: "Corte tradicional con tijera y máquina" },
  { id: "s2", name: "Corte + Barba", duration: 45, price: 25, description: "Corte de cabello y arreglo de barba" },
  { id: "s3", name: "Afeitado Clásico", duration: 30, price: 18, description: "Afeitado tradicional con navaja" },
  { id: "s4", name: "Tinte", duration: 60, price: 35, description: "Coloración completa" },
  { id: "s5", name: "Corte Niño", duration: 20, price: 12, description: "Corte para niños hasta 12 años" },
]

// Demo Employees
export const DEMO_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Carlos Pérez", email: "carlos@barbershop.com", phone: "555-0101", role: "employee" },
  { id: "e2", name: "María García", email: "maria@barbershop.com", phone: "555-0102", role: "employee" },
  { id: "e3", name: "Juan López", email: "juan@barbershop.com", phone: "555-0103", role: "employee" },
  { id: "demo-employee-001", name: "Sofía Ramírez", email: "employee@demo.com", phone: "+1234567895", role: "employee" },
]

// Demo Clients
export const DEMO_CLIENTS: Client[] = [
  { id: "c1", name: "Pedro Martínez", email: "pedro@email.com", phone: "555-1001", createdAt: "2024-01-15", isActive: true },
  { id: "c2", name: "Ana Rodríguez", email: "ana@email.com", phone: "555-1002", createdAt: "2024-02-20", isActive: true },
  { id: "c3", name: "Luis Fernández", email: "luis@email.com", phone: "555-1003", createdAt: "2024-03-10", isActive: true },
  { id: "c4", name: "Carmen Sánchez", email: "carmen@email.com", phone: "555-1004", createdAt: "2024-10-05", isActive: true },
  { id: "c5", name: "Miguel Torres", email: "miguel@email.com", phone: "555-1005", createdAt: "2024-11-12", isActive: true },
]

// Demo Inventory
export const DEMO_INVENTORY: InventoryItem[] = [
  { id: "i1", name: "Shampoo Profesional",  category: "producto",    quantity: 25, minStock: 10, price: 18.50, salePrice: 28.00, sku: "SH-001", supplier: "Beauty Supply Co.", lastRestocked: "2024-11-15", status: "disponible" },
  { id: "i2", name: "Cera para Cabello",    category: "producto",    quantity: 8,  minStock: 10, price: 12.00, salePrice: 20.00, sku: "CW-002", supplier: "Hair Products Inc.", lastRestocked: "2024-11-10", status: "bajo" },
  { id: "i3", name: "Tijeras Profesionales",category: "herramienta", quantity: 15, minStock: 5,  price: 45.00, salePrice: null,  sku: "TJ-003", supplier: "Pro Tools Ltd.",     lastRestocked: "2024-10-20", status: "disponible" },
  { id: "i4", name: "Máquina de Afeitar",   category: "herramienta", quantity: 12, minStock: 8,  price: 85.00, salePrice: null,  sku: "MA-004", supplier: "Barber Equipment",   lastRestocked: "2024-11-01", status: "disponible" },
  { id: "i5", name: "Toallas Desechables",  category: "suministro",  quantity: 0,  minStock: 20, price: 15.00, salePrice: null,  sku: "TD-005", supplier: "Clean Supplies",     lastRestocked: "2024-10-15", status: "agotado" },
  { id: "i6", name: "Cuchillas de Repuesto",category: "suministro",  quantity: 50, minStock: 30, price: 8.50,  salePrice: null,  sku: "CR-006", supplier: "Blade Masters",      lastRestocked: "2024-11-20", status: "disponible" },
  { id: "i7", name: "Gel de Afeitar",       category: "producto",    quantity: 18, minStock: 12, price: 9.75,  salePrice: 16.00, sku: "GA-007", supplier: "Hair Products Inc.", lastRestocked: "2024-11-18", status: "disponible" },
  { id: "i8", name: "Aceite para Barba",    category: "producto",    quantity: 6,  minStock: 8,  price: 22.00, salePrice: 35.00, sku: "AB-008", supplier: "Beauty Supply Co.", lastRestocked: "2024-11-05", status: "bajo" },
]

// Generate demo appointments
const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const nextWeek = new Date(today)
nextWeek.setDate(nextWeek.getDate() + 7)

export const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    clientId: "c1",
    clientName: "Pedro Martínez",
    clientPhone: "555-1001",
    employeeId: "e1",
    employeeName: "Carlos Pérez",
    serviceId: "s2",
    serviceName: "Corte + Barba",
    date: today.toISOString().split('T')[0]!,
    time: "10:00",
    duration: 45,
    price: 25,
    status: "confirmed",
    notes: "Cliente prefiere corte bajo",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "a2",
    clientId: "c2",
    clientName: "Ana Rodríguez",
    clientPhone: "555-1002",
    employeeId: "e2",
    employeeName: "María García",
    serviceId: "s1",
    serviceName: "Corte Clásico",
    date: today.toISOString().split('T')[0]!,
    time: "11:30",
    duration: 30,
    price: 15,
    status: "pending",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "a3",
    clientId: "c3",
    clientName: "Luis Fernández",
    clientPhone: "555-1003",
    employeeId: "e1",
    employeeName: "Carlos Pérez",
    serviceId: "s3",
    serviceName: "Afeitado Clásico",
    date: today.toISOString().split('T')[0]!,
    time: "14:00",
    duration: 30,
    price: 18,
    status: "confirmed",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "a4",
    clientId: "c4",
    clientName: "Carmen Sánchez",
    clientPhone: "555-1004",
    employeeId: "e3",
    employeeName: "Juan López",
    serviceId: "s4",
    serviceName: "Tinte",
    date: tomorrow.toISOString().split('T')[0]!,
    time: "09:00",
    duration: 60,
    price: 35,
    status: "pending",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "a5",
    clientId: "c5",
    clientName: "Miguel Torres",
    clientPhone: "555-1005",
    employeeId: "e2",
    employeeName: "María García",
    serviceId: "s5",
    serviceName: "Corte Niño",
    date: tomorrow.toISOString().split('T')[0]!,
    time: "16:00",
    duration: 20,
    price: 12,
    status: "confirmed",
    notes: "Niño de 8 años",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "a6",
    clientId: "c1",
    clientName: "Pedro Martínez",
    clientPhone: "555-1001",
    employeeId: "e1",
    employeeName: "Carlos Pérez",
    serviceId: "s2",
    serviceName: "Corte + Barba",
    date: new Date(Date.now() - 604800000).toISOString().split('T')[0]!,
    time: "10:00",
    duration: 45,
    price: 25,
    status: "completed",
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
  },
  {
    id: "a7",
    clientId: "c3",
    clientName: "Luis Fernández",
    clientPhone: "555-1003",
    employeeId: "e2",
    employeeName: "María García",
    serviceId: "s1",
    serviceName: "Corte Clásico",
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0]!,
    time: "15:00",
    duration: 30,
    price: 15,
    status: "cancelled",
    notes: "Cliente canceló por motivos personales",
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    id: "a8",
    clientId: "c4",
    clientName: "Carmen Sánchez",
    clientPhone: "555-1004",
    employeeId: "demo-employee-001",
    employeeName: "Sofía Ramírez",
    serviceId: "s1",
    serviceName: "Corte Clásico",
    date: today.toISOString().split('T')[0]!,
    time: "09:30",
    duration: 30,
    price: 15,
    status: "confirmed",
    notes: "Prefiere lateral degradado",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "a9",
    clientId: "c5",
    clientName: "Miguel Torres",
    clientPhone: "555-1005",
    employeeId: "demo-employee-001",
    employeeName: "Sofía Ramírez",
    serviceId: "s3",
    serviceName: "Afeitado Clásico",
    date: tomorrow.toISOString().split('T')[0]!,
    time: "12:00",
    duration: 30,
    price: 18,
    status: "pending",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "a10",
    clientId: "c2",
    clientName: "Ana Rodríguez",
    clientPhone: "555-1002",
    employeeId: "demo-employee-001",
    employeeName: "Sofía Ramírez",
    serviceId: "s2",
    serviceName: "Corte + Barba",
    date: new Date(Date.now() - 432000000).toISOString().split('T')[0]!,
    time: "11:00",
    duration: 45,
    price: 25,
    status: "completed",
    createdAt: new Date(Date.now() - 950400000).toISOString(),
  },
]

// Status labels and valid transitions (shared by Admin and Employee views)
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No se presentó",
}

export function getNextStatusActions(status: AppointmentStatus): { status: AppointmentStatus; label: string }[] {
  switch (status) {
    case "pending":
      return [
        { status: "confirmed", label: "Confirmar" },
        { status: "no_show", label: "No se presentó" },
        { status: "cancelled", label: "Cancelar" },
      ]
    case "confirmed":
      return [
        { status: "completed", label: "Completar" },
        { status: "no_show", label: "No se presentó" },
        { status: "cancelled", label: "Cancelar" },
      ]
    default:
      return []
  }
}

// Helper functions
export function getAppointmentsByDate(date: string): Appointment[] {
  return DEMO_APPOINTMENTS.filter(apt => apt.date === date)
}

export function getAppointmentsByStatus(status: AppointmentStatus): Appointment[] {
  return DEMO_APPOINTMENTS.filter(apt => apt.status === status)
}

export function getAppointmentsByEmployee(employeeId: string): Appointment[] {
  return DEMO_APPOINTMENTS.filter(apt => apt.employeeId === employeeId)
}

export function getServiceById(id: string): Service | undefined {
  return DEMO_SERVICES.find(s => s.id === id)
}

export function getEmployeeById(id: string): Employee | undefined {
  return DEMO_EMPLOYEES.find(e => e.id === id)
}

export function getClientById(id: string): Client | undefined {
  return DEMO_CLIENTS.find(c => c.id === id)
}
