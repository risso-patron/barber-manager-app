import type { User, Appointment, Service, InventoryItem } from "./types"

// Usuarios de demo
export const demoUsers: User[] = [
  {
    id: "admin-demo-id",
    name: "Carlos Administrador",
    email: "admin@barbermanager.com",
    role: "admin",
    phone: "+1234567890",
    avatar_url: "/placeholder-user.jpg",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "employee-demo-id",
    name: "María Barbera",
    email: "empleado@barbermanager.com",
    role: "employee",
    phone: "+1234567891",
    avatar_url: "/placeholder-user.jpg",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "client-demo-id",
    name: "Juan Cliente",
    email: "cliente@barbermanager.com",
    role: "client",
    phone: "+1234567892",
    avatar_url: "/placeholder-user.jpg",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

// Servicios de demo
export const demoServices: Service[] = [
  {
    id: "service-1",
    name: "Corte Clásico",
    description: "Corte de cabello tradicional",
    price: 25.0,
    duration: 30,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "service-2",
    name: "Corte + Barba",
    description: "Corte de cabello y arreglo de barba",
    price: 35.0,
    duration: 45,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "service-3",
    name: "Afeitado Tradicional",
    description: "Afeitado con navaja tradicional",
    price: 20.0,
    duration: 25,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "service-4",
    name: "Corte Niño",
    description: "Corte especial para niños",
    price: 18.0,
    duration: 20,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
]

// Citas de demo
export const demoAppointments: Appointment[] = [
  {
    id: "apt-1",
    client_id: "client-demo-id",
    barber_id: "employee-demo-id",
    service_id: "service-1",
    appointment_date: "2024-12-10",
    appointment_time: "10:00",
    status: "confirmed",
    notes: "Cliente regular",
    created_at: "2024-12-08T00:00:00Z",
    updated_at: "2024-12-08T00:00:00Z",
    client: demoUsers.find((u) => u.id === "client-demo-id"),
    barber: demoUsers.find((u) => u.id === "employee-demo-id"),
    service: demoServices.find((s) => s.id === "service-1"),
  },
  {
    id: "apt-2",
    client_id: "client-demo-id",
    barber_id: "employee-demo-id",
    service_id: "service-2",
    appointment_date: "2024-12-12",
    appointment_time: "14:30",
    status: "pending",
    notes: "Primera vez con barba",
    created_at: "2024-12-08T00:00:00Z",
    updated_at: "2024-12-08T00:00:00Z",
    client: demoUsers.find((u) => u.id === "client-demo-id"),
    barber: demoUsers.find((u) => u.id === "employee-demo-id"),
    service: demoServices.find((s) => s.id === "service-2"),
  },
  {
    id: "apt-3",
    client_id: "client-demo-id",
    barber_id: "employee-demo-id",
    service_id: "service-1",
    appointment_date: "2024-12-01",
    appointment_time: "11:00",
    status: "completed",
    notes: "Muy satisfecho con el servicio",
    feedback: "Excelente servicio, muy profesional",
    rating: 5,
    created_at: "2024-11-29T00:00:00Z",
    updated_at: "2024-12-01T00:00:00Z",
    client: demoUsers.find((u) => u.id === "client-demo-id"),
    barber: demoUsers.find((u) => u.id === "employee-demo-id"),
    service: demoServices.find((s) => s.id === "service-1"),
  },
]

// Inventario de demo
export const demoInventory: InventoryItem[] = [
  {
    id: "inv-1",
    product_name: "Shampoo Profesional",
    quantity: 13,
    min_stock: 5,
    supplier: "Distribuidora ABC",
    cost_per_unit: 12.5,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-12-08T00:00:00Z",
  },
  {
    id: "inv-2",
    product_name: "Cera para Cabello",
    quantity: 7,
    min_stock: 3,
    supplier: "Productos XYZ",
    cost_per_unit: 8.0,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-12-08T00:00:00Z",
  },
  {
    id: "inv-3",
    product_name: "Aceite para Barba",
    quantity: 17,
    min_stock: 4,
    supplier: "Distribuidora ABC",
    cost_per_unit: 15.0,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-12-08T00:00:00Z",
  },
  {
    id: "inv-4",
    product_name: "Toallas Desechables",
    quantity: 3,
    min_stock: 10,
    supplier: "Suministros DEF",
    cost_per_unit: 0.5,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-12-08T00:00:00Z",
  },
  {
    id: "inv-5",
    product_name: "Cuchillas de Afeitar",
    quantity: 23,
    min_stock: 8,
    supplier: "Productos XYZ",
    cost_per_unit: 2.0,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-12-08T00:00:00Z",
  },
]

// Función para autenticar usuario demo
export function authenticateDemoUser(email: string, password: string): User | null {
  const validCredentials = [
    { email: "admin@barbermanager.com", password: "admin123" },
    { email: "empleado@barbermanager.com", password: "empleado123" },
    { email: "cliente@barbermanager.com", password: "cliente123" },
  ]

  const isValid = validCredentials.some((cred) => cred.email === email && cred.password === password)

  if (isValid) {
    return demoUsers.find((user) => user.email === email) || null
  }

  return null
}

// Función para obtener datos según el rol
export function getDemoDataForRole(role: string) {
  switch (role) {
    case "admin":
      return {
        appointments: demoAppointments,
        inventory: demoInventory,
        services: demoServices,
        users: demoUsers,
      }
    case "employee":
      return {
        appointments: demoAppointments.filter((apt) => apt.barber_id === "employee-demo-id"),
        services: demoServices,
      }
    case "client":
      return {
        appointments: demoAppointments.filter((apt) => apt.client_id === "client-demo-id"),
        services: demoServices,
      }
    default:
      return {}
  }
}
