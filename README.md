# 💈 Barber Manager

Sistema de gestión profesional para barberías modernas. Administra citas, empleados, clientes y servicios en una plataforma completa y elegante.

![Next.js](https://img.shields.io/badge/Next.js-15.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)
![License](https://img.shields.io/badge/license-MIT-green)

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
# Copia el archivo de ejemplo
cp .env.local.example .env.local

# Edita .env.local con tus credenciales de Supabase
\`\`\`

4. Configura tu proyecto de Supabase:
   - Crea un nuevo proyecto en [Supabase](https://supabase.com)
   - Ve a Settings > API para obtener tu URL y Anon Key
   - Ejecuta los scripts SQL en orden:
     1. `scripts/01-create-tables.sql` - Crea las tablas
     2. `scripts/02-seed-data.sql` - Datos iniciales
     3. `scripts/03-create-demo-users.sql` - Usuarios demo (opcional)
   - Actualiza `.env.local` con tus credenciales

5. Ejecuta el proyecto:
\`\`\`bash
npm run dev
\`\`\`

6. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## 🔒 Seguridad

Este proyecto implementa múltiples capas de seguridad:

### Protecciones Implementadas
- ✅ **Rate Limiting**: Protección contra brute force y spam
- ✅ **Input Validation**: Sanitización y validación de datos
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- ✅ **Pre-commit Hooks**: Bloqueo de secrets en commits
- ✅ **Environment Validation**: Verificación de configuración

### Scripts de Seguridad
```bash
# Validar variables de entorno
npm run validate-env

# Verificar seguridad del código
npm run security-check

# Configurar git hooks
npm run setup-hooks
```

### Documentación de Seguridad
- 📄 [SECURITY-REPORT.md](SECURITY-REPORT.md) - Análisis completo de seguridad
- 📄 [docs/SECRET-ROTATION.md](docs/SECRET-ROTATION.md) - Guía de rotación de secrets
- 📄 [docs/SECURITY-IMPLEMENTATION.md](docs/SECURITY-IMPLEMENTATION.md) - Implementaciones actuales

⚠️ **IMPORTANTE**: Antes de producción, revisa [SECURITY-REPORT.md](SECURITY-REPORT.md) y rota todos los secrets.

## Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo
npm run build        # Genera build de producción
npm run start        # Inicia servidor de producción

# Calidad de código
npm run lint         # Ejecuta ESLint
npm run type-check   # Verifica tipos TypeScript
npm run format       # Formatea código con Prettier

# Seguridad
npm run validate-env # Valida variables de entorno
npm run security-check # Verifica seguridad antes de commit
npm run setup-hooks  # Configura git hooks de seguridad
npm run predeploy    # Checklist pre-deployment
```

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
