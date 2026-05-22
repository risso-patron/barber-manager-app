/**
 * Configuración centralizada para el modo Demo
 * 
 * Este archivo contiene todos los datos y configuraciones necesarias
 * para ejecutar la aplicación en modo demo sin necesidad de base de datos.
 */

// Usuarios de demostración
export const DEMO_USERS = {
  admin: {
    id: 'demo-admin-001',
    email: 'admin@demo.com',
    password: 'Demo1234',
    name: 'Admin Demo',
    role: 'admin' as const,
    phone: '+1234567890',
    avatar_url: null
  },
  barber: {
    id: 'demo-barber-001',
    email: 'barber@demo.com',
    password: 'Demo1234',
    name: 'Carlos Martínez',
    role: 'barber' as const,
    phone: '+1234567891',
    avatar_url: null
  },
  client: {
    id: 'demo-client-001',
    email: 'client@demo.com',
    password: 'Demo1234',
    name: 'Juan Pérez',
    role: 'client' as const,
    phone: '+1234567892',
    avatar_url: null
  }
};

// Servicios disponibles
export const DEMO_SERVICES = [
  {
    id: 'service-001',
    name: 'Corte de Cabello',
    description: 'Corte profesional con técnicas modernas',
    price: 25,
    duration: 30,
    category: 'haircut',
    isActive: true
  },
  {
    id: 'service-002',
    name: 'Barba y Bigote',
    description: 'Arreglo completo de barba con toalla caliente',
    price: 20,
    duration: 25,
    category: 'beard',
    isActive: true
  },
  {
    id: 'service-003',
    name: 'Corte + Barba',
    description: 'Combo completo de corte y barba',
    price: 40,
    duration: 50,
    category: 'combo',
    isActive: true
  },
  {
    id: 'service-004',
    name: 'Corte Niño',
    description: 'Corte especial para niños menores de 12 años',
    price: 18,
    duration: 20,
    category: 'haircut',
    isActive: true
  },
  {
    id: 'service-005',
    name: 'Afeitado Clásico',
    description: 'Afeitado tradicional con navaja',
    price: 30,
    duration: 35,
    category: 'shave',
    isActive: true
  }
];

// Empleados/Barberos
export const DEMO_EMPLOYEES = [
  {
    id: 'emp-001',
    name: 'Carlos Martínez',
    email: 'barber@demo.com',
    role: 'barber' as const,
    phone: '+1234567891',
    specialties: ['Cortes clásicos', 'Barbería tradicional'],
    rating: 4.9,
    isActive: true
  },
  {
    id: 'emp-002',
    name: 'María García',
    email: 'maria@barberia.com',
    role: 'barber' as const,
    phone: '+1234567893',
    specialties: ['Cortes modernos', 'Diseños'],
    rating: 4.8,
    isActive: true
  },
  {
    id: 'emp-003',
    name: 'Pedro López',
    email: 'pedro@barberia.com',
    role: 'barber' as const,
    phone: '+1234567894',
    specialties: ['Barbería clásica', 'Afeitado'],
    rating: 4.7,
    isActive: true
  }
];

// Configuración del negocio
export const DEMO_BUSINESS_SETTINGS = {
  name: 'Barber Manager Demo',
  slogan: 'Tu estilo, nuestra pasión',
  phone: '+1 (555) 123-4567',
  email: 'info@barbermanager.demo',
  address: 'Av. Principal 123, Ciudad Demo',
  
  // Horarios
  schedule: {
    monday: { open: '09:00', close: '20:00', isOpen: true },
    tuesday: { open: '09:00', close: '20:00', isOpen: true },
    wednesday: { open: '09:00', close: '20:00', isOpen: true },
    thursday: { open: '09:00', close: '20:00', isOpen: true },
    friday: { open: '09:00', close: '21:00', isOpen: true },
    saturday: { open: '08:00', close: '18:00', isOpen: true },
    sunday: { open: '10:00', close: '14:00', isOpen: true }
  },

  // Políticas
  policies: {
    cancellationHours: 24,
    advanceBookingDays: 30,
    slotDuration: 15, // minutos
    breakBetweenAppointments: 5 // minutos
  },

  // Notificaciones
  notifications: {
    emailEnabled: true,
    whatsappEnabled: true,
    reminderHoursBefore: 24,
    sendConfirmation: true
  },

  // Redes sociales
  social: {
    instagram: '@barbermanagerdemo',
    facebook: 'BarberManagerDemo',
    twitter: '@barberdemo'
  }
};

// Estados de citas
export const APPOINTMENT_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
} as const;

// Traducciones de estados
export const STATUS_LABELS = {
  [APPOINTMENT_STATUSES.PENDING]: 'Pendiente',
  [APPOINTMENT_STATUSES.CONFIRMED]: 'Confirmada',
  [APPOINTMENT_STATUSES.COMPLETED]: 'Completada',
  [APPOINTMENT_STATUSES.CANCELLED]: 'Cancelada',
  [APPOINTMENT_STATUSES.NO_SHOW]: 'No asistió'
};

// Colores de estados
export const STATUS_COLORS = {
  [APPOINTMENT_STATUSES.PENDING]: 'yellow',
  [APPOINTMENT_STATUSES.CONFIRMED]: 'blue',
  [APPOINTMENT_STATUSES.COMPLETED]: 'green',
  [APPOINTMENT_STATUSES.CANCELLED]: 'red',
  [APPOINTMENT_STATUSES.NO_SHOW]: 'gray'
};

// Utilidad para verificar si estamos en modo demo
export const isDemoMode = () => {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || 
         process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo');
};

// Mensaje de demo mode
export const DEMO_MODE_MESSAGE = `
🎭 Modo Demo Activado

Estás usando Barber Manager en modo demostración.
Los datos se guardan localmente y no requieren base de datos.

Usuarios de prueba:
• Admin: admin@demo.com / Demo1234
• Barbero: barber@demo.com / Demo1234
• Cliente: client@demo.com / Demo1234

Para usar en producción, configura Supabase en .env.local
`;

// Configuración de localStorage
export const STORAGE_KEYS = {
  AUTH_USER: 'barber_manager_auth_user',
  APPOINTMENTS: 'barber_manager_appointments',
  USER_CONSENT: 'barber_manager_user_consent',
  THEME: 'barber_manager_theme'
};
