# Barber Manager

Una aplicación completa de gestión para barberías construida con Next.js 15 y Supabase.

## Características

### 🔐 Autenticación por Roles
- **Cliente**: Reserva de citas, historial de servicios, feedback
- **Empleado**: Agenda diaria, control de horarios, estadísticas
- **Administrador**: Dashboard completo, gestión de empleados, inventario, reportes

### 📅 Gestión de Citas
- Sistema de reservas en tiempo real
- Calendario interactivo
- Estados de cita (pendiente, confirmada, completada, cancelada)
- Notificaciones automáticas

### 💈 Panel de Empleados
- Control de entrada/salida
- Gestión de pausas
- Estadísticas de rendimiento
- Agenda personalizada

### 🧑‍💼 Panel Administrativo
- Dashboard con métricas clave
- Gestión completa de empleados
- Control de inventario con alertas
- Reportes financieros
- Configuración de servicios

### 📦 Sistema de Inventario
- Control de stock en tiempo real
- Historial de movimientos
- Alertas de stock bajo
- Gestión de proveedores

## Tecnologías

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **UI**: Tailwind CSS, shadcn/ui
- **Estado**: Zustand
- **Formularios**: React Hook Form
- **Despliegue**: Vercel

## Instalación

1. Clona el repositorio:
\`\`\`bash
git clone <repository-url>
cd barber-manager
\`\`\`

2. Instala las dependencias:
\`\`\`bash
npm install
\`\`\`

3. Configura las variables de entorno:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Configura tu proyecto de Supabase:
   - Crea un nuevo proyecto en [Supabase](https://supabase.com)
   - Ejecuta los scripts SQL en `scripts/` para crear las tablas
   - Actualiza las variables de entorno con tus credenciales

5. Ejecuta el proyecto:
\`\`\`bash
npm run dev
\`\`\`

## Estructura del Proyecto

\`\`\`
├── app/                    # App Router de Next.js
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard principal
│   ├── admin/             # Rutas de administrador
│   ├── employee/          # Rutas de empleado
│   └── client/            # Rutas de cliente
├── components/            # Componentes reutilizables
│   ├── auth/              # Componentes de autenticación
│   ├── dashboard/         # Componentes del dashboard
│   ├── layout/            # Componentes de layout
│   └── ui/                # Componentes de UI (shadcn)
├── lib/                   # Utilidades y configuración
│   ├── supabase/          # Configuración de Supabase
│   ├── auth.ts            # Utilidades de autenticación
│   ├── store.ts           # Estado global (Zustand)
│   └── types.ts           # Tipos de TypeScript
├── scripts/               # Scripts SQL para la base de datos
└── middleware.ts          # Middleware de Next.js
\`\`\`

## Base de Datos

### Tablas Principales

- `users`: Perfiles de usuario con roles
- `appointments`: Citas con barberos
- `services`: Servicios ofrecidos
- `inventory`: Productos e inventario
- `inventory_movements`: Historial de movimientos
- `time_logs`: Control de horarios de empleados
- `business_settings`: Configuración del negocio

### Políticas de Seguridad (RLS)

Todas las tablas implementan Row Level Security para garantizar que los usuarios solo accedan a sus datos autorizados según su rol.

## Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Variables de Entorno Requeridas

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
\`\`\`

## Funcionalidades por Rol

### Cliente
- ✅ Registro e inicio de sesión
- ✅ Reserva de citas
- ✅ Selección de barbero
- ✅ Historial de servicios
- 🔄 Sistema de feedback
- 🔄 Notificaciones por email

### Empleado
- ✅ Agenda diaria
- 🔄 Control de entrada/salida
- 🔄 Gestión de pausas
- 🔄 Estadísticas personales

### Administrador
- ✅ Dashboard general
- 🔄 Gestión de empleados
- 🔄 Control de inventario
- 🔄 Reportes financieros
- 🔄 Configuración de servicios
- 🔄 Exportación de datos

## Próximas Funcionalidades

- [ ] Sistema de notificaciones push
- [ ] Integración con WhatsApp/SMS
- [ ] Programa de fidelidad
- [ ] Reportes avanzados con gráficas
- [ ] App móvil nativa
- [ ] Sistema de pagos online
- [ ] Integración con redes sociales

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## Soporte

Para soporte y preguntas, abre un issue en el repositorio o contacta al equipo de desarrollo.
