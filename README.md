# 💈 Barber Manager

Sistema de gestión profesional para barberías modernas. Administra citas, empleados, clientes, inventario, punto de venta y más — en una plataforma completa y elegante.

![Next.js](https://img.shields.io/badge/Next.js-15.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)
![Version](https://img.shields.io/badge/version-1.1-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## Características

### 🔐 Autenticación por Roles
- **Cliente**: Reserva de citas, historial, calificaciones, puntos de fidelidad
- **Empleado**: Agenda diaria, control de jornada laboral persistente, estadísticas y comisiones
- **Administrador**: Dashboard completo, gestión de empleados y clientes, inventario, POS, reportes y alertas

### 📅 Gestión de Citas
- Sistema de reservas en tiempo real
- Reagendamiento de citas (M1)
- Cancelación por cliente o administrador

### ⭐ Calificaciones (M5)
- Los clientes califican con 1-5 estrellas tras una cita completada
- Comentario opcional

### 💰 Comisiones (M2)
- Porcentaje de comisión por empleado configurable
- Cálculo automático al completar una cita

### 🕐 Jornada Laboral Persistente (M3)
- Estado "trabajando / no trabajando" se guarda en la base de datos
- Persiste aunque se cierre o recargue el navegador

### 🔑 Recuperación de Contraseña (M4)
- Flujo de reset por email integrado con Supabase Auth

### 🏆 Puntos de Fidelidad (M6)
- 1 punto por dólar gastado en citas o POS
- Historial de transacciones con saldo en tiempo real

### 🛒 Punto de Venta — POS (M7)
- Registro de ventas directas (efectivo, tarjeta, transferencia)
- Items por servicio o producto
- Descuentos y notas por venta

### 🚨 Alertas de Calificación Baja (M8)
- Alerta automática cuando un cliente califica con 1 o 2 estrellas
- Panel de resolución en el dashboard de admin

5. Ejecuta el proyecto:
```bash
pnpm dev
```

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
pnpm validate-env

# Verificar seguridad del código
pnpm security-check

# Configurar git hooks
pnpm setup-hooks
```

### Documentación de Seguridad
- 📄 [SECURITY-REPORT.md](SECURITY-REPORT.md) - Análisis completo de seguridad
- 📄 [docs/SECRET-ROTATION.md](docs/SECRET-ROTATION.md) - Guía de rotación de secrets
- 📄 [docs/SECURITY-IMPLEMENTATION.md](docs/SECURITY-IMPLEMENTATION.md) - Implementaciones actuales

⚠️ **IMPORTANTE**: Antes de producción, revisa [SECURITY-REPORT.md](SECURITY-REPORT.md) y rota todos los secrets.

## Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Inicia el servidor de desarrollo
pnpm build        # Genera build de producción
pnpm start        # Inicia servidor de producción

# Calidad de código
pnpm lint         # Ejecuta ESLint
pnpm type-check   # Verifica tipos TypeScript
pnpm format       # Formatea código con Prettier

# Seguridad
pnpm validate-env # Valida variables de entorno
pnpm security-check # Verifica seguridad antes de commit
pnpm setup-hooks  # Configura git hooks de seguridad
pnpm predeploy    # Checklist pre-deployment
```

## Estructura del Proyecto

```
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
```

## Base de Datos

### Tablas Principales

- `users`: Perfiles con roles, `commission_rate` y `loyalty_points`
- `appointments`: Citas con `rating`, `review_text` y `rescheduled_at`
- `services`: Servicios ofrecidos
- `inventory`: Productos e inventario
- `inventory_movements`: Historial de movimientos
- `business_settings`: Configuración del negocio
- `attendance_logs`: Jornadas laborales de empleados (M3)
- `employee_commissions`: Comisiones por cita completada (M2)
- `loyalty_transactions`: Historial de puntos de fidelidad (M6)
- `pos_sales`: Ventas del punto de venta (M7)
- `pos_sale_items`: Líneas de detalle de ventas POS (M7)
- `low_rating_alerts`: Alertas de calificaciones bajas (M8)

### Políticas de Seguridad (RLS)

Todas las tablas implementan Row Level Security para garantizar que los usuarios solo accedan a sus datos autorizados según su rol.

## Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Variables de Entorno Requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

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
