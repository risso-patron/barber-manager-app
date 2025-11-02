# ✂️ Barber Manager App

> Sistema integral de gestión para barberías - Administra citas, empleados, inventario y finanzas en una sola plataforma

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat&logo=supabase)](https://supabase.com/)

![Barber Manager App Preview](https://via.placeholder.com/800x400/0f172a/ffffff?text=Barber+Manager+App)

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Base de Datos](#-base-de-datos)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

---

## 🎯 Descripción

**Barber Manager App** es una aplicación web moderna diseñada para optimizar la gestión completa de barberías y salones de belleza. Desarrollada con las últimas tecnologías web, ofrece una solución integral que abarca desde la reservación de citas hasta el control financiero del negocio.

### 🎨 Demo en Vivo
- **Landing Page**: [localhost:3000](http://localhost:3000)
- **Admin Panel**: [localhost:3000/admin](http://localhost:3000/admin)

### 🎥 Screenshots
*(Próximamente)*

---

## ✨ Características

### ✅ Implementadas

- **🔐 Autenticación Multi-Rol**
  - Sistema de registro y login seguro con Supabase
  - Tres niveles de acceso: Admin, Empleado, Cliente
  - Routing automático basado en roles
  - Recuperación de contraseña (próximamente)

- **📊 Base de Datos Relacional**
  - 10 tablas con relaciones optimizadas
  - Row Level Security (RLS) para seguridad
  - Triggers automáticos para cálculo de comisiones
  - Seed data para desarrollo rápido

- **🎨 UI/UX Moderna**
  - Landing page con diseño gradient profesional
  - Formularios responsivos con validación
  - Mensajes de error y éxito claros
  - Diseño mobile-first

### 🚧 En Desarrollo

- **📅 Sistema de Citas**
  - Calendario interactivo
  - Selección de barbero y servicio
  - Validación de disponibilidad en tiempo real
  - Confirmaciones y recordatorios por email

- **👥 Gestión de Empleados**
  - Control de horarios (check-in/check-out)
  - Cálculo automático de comisiones (40% por defecto)
  - Reportes de desempeño
  - Gestión de permisos

- **📦 Control de Inventario**
  - CRUD de productos e insumos
  - Alertas de stock bajo
  - Registro de movimientos
  - Reportes de consumo

- **💰 Módulo Financiero**
  - Dashboard de ingresos y egresos
  - Gráficos de tendencias
  - Reportes mensuales/anuales
  - Gestión de comisiones

- **🎁 Programa de Lealtad**
  - Acumulación de puntos por visita
  - Recompensas y descuentos
  - Historial de clientes frecuentes

---

## 🛠️ Tecnologías

### Frontend
- **[Next.js 15.2.4](https://nextjs.org/)** - Framework React con App Router
- **[React 19.0.0](https://reactjs.org/)** - Biblioteca para construcción de UI
- **[TypeScript 5.0.2](https://www.typescriptlang.org/)** - Superset de JavaScript con tipado estático
- **Tailwind CSS** *(en integración)* - Framework CSS utility-first

### Backend & Database
- **[Supabase](https://supabase.com/)** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Row Level Security
  - Real-time subscriptions
- **PostgreSQL** - Base de datos relacional

### DevOps & Tools
- **pnpm** - Gestor de paquetes rápido y eficiente
- **Git & GitHub** - Control de versiones
- **VS Code** - Editor de código

---

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- pnpm 8+
- Cuenta de Supabase (gratis)

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/Luisitorisso/barber-manager-app.git
cd barber-manager-app
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Configurar la base de datos**

Ve a [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor

Ejecuta los scripts en orden:
1. `scripts/01-create-tables.sql` - Crea las tablas
2. `scripts/02-seed-data.sql` - Inserta datos de prueba

Consulta `SETUP-DATABASE.md` para más detalles.

5. **Iniciar servidor de desarrollo**
```bash
pnpm dev
```

6. **Abrir en el navegador**
```
http://localhost:3000
```

---

## 🚀 Uso

### Crear primer usuario administrador

1. Registrarse en `/auth/register`
2. Ir a Supabase Dashboard → Table Editor → Tabla `users`
3. Cambiar el campo `role` de `'client'` a `'admin'`
4. Hacer login en `/auth/login`
5. Serás redirigido a `/admin`

### Flujo de trabajo típico

**Como Administrador:**
1. Gestionar servicios y precios
2. Dar de alta empleados
3. Ver reportes financieros
4. Gestionar inventario

**Como Empleado:**
1. Registrar entrada/salida
2. Ver citas del día
3. Consultar comisiones

**Como Cliente:**
1. Reservar citas
2. Ver historial de servicios
3. Acumular puntos de lealtad

---

## 📁 Estructura del Proyecto

```
barber-manager-app/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Landing page
│   ├── layout.tsx           # Layout raíz
│   ├── auth/
│   │   ├── login/           # Página de login
│   │   └── register/        # Página de registro
│   ├── admin/               # Panel administrador
│   ├── employee/            # Panel empleado
│   └── client/              # Panel cliente
├── components/              # Componentes reutilizables
│   ├── auth/               # Componentes de autenticación
│   ├── appointments/       # Componentes de citas
│   ├── employee/           # Componentes de empleados
│   └── ui/                 # Componentes UI genéricos
├── lib/                    # Lógica de negocio
│   ├── supabase/          # Cliente Supabase
│   ├── database-helpers.ts # Helpers de BD
│   ├── types.ts           # Interfaces TypeScript
│   └── utils.ts           # Utilidades
├── scripts/               # Scripts SQL
│   ├── 01-create-tables.sql
│   ├── 02-seed-data.sql
│   └── 03-useful-queries.sql
├── public/                # Archivos estáticos
├── DATABASE-SUMMARY.md    # Documentación de BD
├── PROJECT-LOG.md         # Bitácora del proyecto
└── README.md             # Este archivo
```

---

## 🗄️ Base de Datos

### Esquema Principal

El proyecto utiliza **10 tablas relacionales**:

1. **users** - Usuarios del sistema (admin, employee, client)
2. **services** - Servicios ofrecidos (corte, barba, etc.)
3. **appointments** - Reservaciones y citas
4. **inventory** - Productos e insumos
5. **inventory_movements** - Registro de entradas/salidas
6. **time_logs** - Control de horarios de empleados
7. **business_settings** - Configuraciones del negocio
8. **financial_transactions** - Transacciones de ingreso/egreso
9. **employee_commissions** - Comisiones calculadas
10. **customer_loyalty** - Puntos y recompensas

### Características Avanzadas

- ✅ **Row Level Security (RLS)** en todas las tablas
- ✅ **Triggers automáticos** para cálculo de comisiones
- ✅ **Índices** para optimización de consultas
- ✅ **Funciones helper** para reportes complejos

Consulta `DATABASE-SUMMARY.md` para documentación completa.

---

## 🗺️ Roadmap

### Versión 1.0 (MVP) - Enero 2026
- [x] Sistema de autenticación
- [x] Base de datos completa
- [ ] Dashboard de administrador
- [ ] Sistema de citas básico
- [ ] Gestión de empleados

### Versión 1.5 - Febrero 2026
- [ ] Control de inventario
- [ ] Reportes financieros
- [ ] Programa de lealtad
- [ ] Notificaciones por email

### Versión 2.0 - Marzo 2026
- [ ] App móvil (React Native)
- [ ] Pagos en línea
- [ ] Multi-sucursal
- [ ] Analytics avanzado

---

## 🤝 Contribuir

Este es un proyecto de portafolio personal, pero las sugerencias son bienvenidas!

1. Fork el proyecto
2. Crea tu Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al Branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👤 Autor

**Luis Risso**

- GitHub: [@Luisitorisso](https://github.com/Luisitorisso)
- Email: Luisrissopa@gmail.com
- LinkedIn: *(Añade tu perfil)*
- Portfolio: *(Añade tu sitio web)*

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) por el excelente framework
- [Supabase](https://supabase.com/) por el backend simplificado
- [Vercel](https://vercel.com/) por el hosting (próximamente)

---

## 📸 Capturas de Pantalla

### Landing Page
*(Próximamente)*

### Admin Dashboard
*(Próximamente)*

### Sistema de Citas
*(Próximamente)*

---

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!**

---

*Desarrollado con ❤️ por Luis Risso - Noviembre 2025*

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
