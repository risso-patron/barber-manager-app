# Manual del Sistema

**Barber Manager App — Versión 1.1**  
**Perfil:** Desarrolladores y administradores técnicos  
**Stack:** Next.js 15 (App Router) · TypeScript 5 · Supabase · Tailwind CSS · pnpm

---

## Tabla de contenidos

1. [Requisitos del entorno](#1-requisitos-del-entorno)
2. [Variables de entorno](#2-variables-de-entorno)
3. [Instalación y arranque](#3-instalación-y-arranque)
4. [Arquitectura general](#4-arquitectura-general)
5. [Base de datos](#5-base-de-datos)
6. [Autenticación y roles](#6-autenticación-y-roles)
7. [Middleware y control de acceso](#7-middleware-y-control-de-acceso)
8. [API Endpoints](#8-api-endpoints)
9. [Rate limiting](#9-rate-limiting)
10. [Modo demo](#10-modo-demo)
11. [Seguridad](#11-seguridad)
12. [Scripts de base de datos](#12-scripts-de-base-de-datos)
13. [Despliegue en Vercel](#13-despliegue-en-vercel)
14. [Comandos de desarrollo](#14-comandos-de-desarrollo)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Requisitos del entorno

| Requisito | Versión mínima | Notas |
|-----------|---------------|-------|
| Node.js | 18.x | Recomendado: LTS más reciente |
| pnpm | 8.x | Gestor de paquetes del proyecto |
| Supabase | — | Proyecto activo (free tier es suficiente) |
| Git | cualquiera | |

> **Importante:** Usar **pnpm** exclusivamente. No usar `npm` ni `yarn` en este proyecto.

---

## 2. Variables de entorno

Copiar `.env.example` a `.env.local` y completar todos los valores:

```bash
cp .env.example .env.local
```

### Variables obligatorias

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL | URL del proyecto de Supabase (ej: `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | String | Clave pública anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | String | Clave de servicio (solo server-side). **Nunca exponer al cliente** |

### Variables opcionales

| Variable | Tipo | Descripción | Default |
|----------|------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | URL | URL pública de la app | `http://localhost:3000` |
| `APP_ENV` | String | Entorno: `production`, `staging`, `development` | `NODE_ENV` |
| `UPSTASH_REDIS_REST_URL` | URL | URL de Upstash Redis para rate limiting persistente | — |
| `UPSTASH_REDIS_REST_TOKEN` | String | Token de Upstash Redis | — |

> Sin `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`, el rate limiting usa memoria en proceso (no es seguro en entornos serverless con múltiples instancias).

### Validar variables antes de deploy

```bash
pnpm run validate-env
```

Este script verifica que todas las variables obligatorias estén presentes y con el formato correcto.

---

## 3. Instalación y arranque

```bash
# Clonar el repositorio
git clone https://github.com/risso-patron/barber-manager-app.git
cd barber-manager-app

# Instalar dependencias
pnpm install

# Configurar entorno
cp .env.example .env.local
# Editar .env.local con tus valores de Supabase

# Ejecutar scripts de base de datos en orden (desde Supabase SQL editor)
# Ver sección 12 para el orden correcto

# Arrancar servidor de desarrollo
pnpm run dev
```

Abrir `http://localhost:3000`.

---

## 4. Arquitectura general

```
barber-manager-app/
├── app/                    # Next.js App Router
│   ├── admin/              # Rutas del administrador
│   ├── barber/             # Rutas del empleado/barbero
│   ├── client/             # Rutas del cliente autenticado
│   ├── auth/               # Login, registro
│   ├── reservar/           # Reserva pública (sin login)
│   ├── book/               # Reserva por slug compartido
│   ├── api/                # API Routes (server-side)
│   ├── dashboard/          # Dispatcher de roles
│   ├── layout.tsx          # Layout raíz (providers, fonts)
│   └── providers.tsx       # ThemeProvider, etc.
├── components/             # Componentes React reutilizables
│   ├── admin/              # Componentes exclusivos del panel admin
│   ├── auth/               # Login, register, terms modal
│   ├── booking/            # Flujo de reservas
│   ├── client/             # Componentes del panel cliente
│   ├── dashboard/          # Componentes compartidos del dashboard
│   ├── layout/             # Sidebar, header, nav
│   └── ui/                 # Componentes base (shadcn/ui)
├── lib/                    # Lógica de negocio y utilidades
│   ├── supabase/           # Clientes de Supabase
│   │   ├── client.ts       # Cliente browser (anon key)
│   │   └── server.ts       # Cliente server (SSR + admin)
│   ├── auth.ts             # Helpers de autenticación
│   ├── env.ts              # Validación de vars de entorno (Zod)
│   ├── rate-limit.ts       # Rate limiting (Upstash o in-memory)
│   ├── schemas.ts          # Esquemas Zod de validación
│   ├── types.ts            # Tipos TypeScript del dominio
│   ├── store.ts            # Estado global (Zustand)
│   ├── demo-config.ts      # Datos y configuración del modo demo
│   └── utils.ts            # Utilidades generales
├── hooks/                  # React hooks
│   ├── useAuth.tsx         # Hook de autenticación
│   └── useRequireAuth.ts   # Redirect si no autenticado
├── middleware.ts           # Control de acceso por rol
├── scripts/                # Scripts SQL para la base de datos
├── docs/                   # Documentación
├── e2e/                    # Tests end-to-end (Playwright)
└── tests/                  # Tests unitarios (Vitest)
```

### Flujo de datos

La arquitectura sigue un flujo **unidireccional estricto**. Ninguna capa puede saltarse a la siguiente sin pasar por los controles intermedios:

```
┌─────────────────────────────────────────────────────┐
│  1. Browser / Cliente                               │
│     React components + hooks (useAuth, useState)    │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP request
┌──────────────────────▼──────────────────────────────┐
│  2. middleware.ts                                   │
│     - Verifica sesión (cookie de Supabase)          │
│     - Valida rol del usuario                        │
│     - Redirige o deja pasar                         │
└──────────────────────┬──────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
┌──────────▼──────────┐  ┌─────────▼────────────────┐
│  3a. Page / RSC     │  │  3b. API Route            │
│  (server component) │  │  app/api/*/route.ts       │
│  Renderizado SSR    │  │  - Zod validation         │
│  con datos iniciales│  │  - Rate limiting          │
│                     │  │  - Rol check explícito    │
└──────────┬──────────┘  └─────────┬────────────────┘
           │                       │
           └───────────┬───────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  4. Supabase Client                                 │
│     createServerSupabaseClient()  → respeta RLS     │
│     createAdminSupabaseClient()   → bypasea RLS     │
│     (el segundo solo para operaciones admin)        │
└──────────────────────┬──────────────────────────────┘
                       │ SQL query
┌──────────────────────▼──────────────────────────────┐
│  5. PostgreSQL + RLS (Supabase)                     │
│     - Políticas RLS filtran filas por rol/uid       │
│     - Última línea de defensa                       │
└─────────────────────────────────────────────────────┘
```

**Principio clave:** La UI no toma decisiones de acceso — solo muestra u oculta según el estado. El acceso real lo controlan el middleware (rutas), la API route (lógica de negocio) y RLS (datos).

---

## 5. Base de datos

### Tablas principales

#### `users`
Extiende `auth.users` de Supabase con datos del perfil.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK; referencia a `auth.users.id` |
| `email` | text | Email del usuario |
| `full_name` | text | Nombre completo |
| `phone` | text | Teléfono |
| `role` | text | `admin` / `employee` / `client` |
| `avatar_url` | text | URL del avatar |
| `commission_rate` | numeric | % de comisión del empleado (default 0) |
| `loyalty_points` | integer | Puntos de fidelidad acumulados (default 0) |
| `is_active` | boolean | Estado del usuario |
| `created_at` | timestamptz | Fecha de creación |

#### `services`
Catálogo de servicios que ofrece la barbería.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `name` | text | Nombre del servicio |
| `description` | text | Descripción |
| `price` | numeric | Precio |
| `duration` | integer | Duración en minutos |
| `is_active` | boolean | Si está disponible para reservas |
| `created_at` | timestamptz | |

#### `appointments`
Registro de todas las citas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `client_id` | uuid | FK → `users.id` |
| `barber_id` | uuid | FK → `users.id` (empleado) |
| `service_id` | uuid | FK → `services.id` |
| `appointment_date` | date | Fecha de la cita |
| `appointment_time` | time | Hora de la cita |
| `status` | text | `pending` / `confirmed` / `completed` / `cancelled` |
| `notes` | text | Notas adicionales |
| `admin_notes` | text | Notas internas del admin |
| `rating` | integer | Calificación del cliente (1-5, nullable) |
| `review_text` | text | Comentario de la calificación (nullable) |
| `rescheduled_at` | timestamptz | Fecha del último reagendamiento (nullable) |
| `created_at` | timestamptz | |

#### `inventory`
Stock de productos y herramientas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `product_name` | text | Nombre del producto |
| `category` | text | `suministro` / `producto` / `herramienta` |
| `quantity` | integer | Cantidad actual |
| `min_stock` | integer | Stock mínimo de alerta |
| `cost_per_unit` | numeric | Costo por unidad |
| `supplier` | text | Proveedor |
| `updated_at` | timestamptz | |

#### `attendance_logs` (M3)
Registro de jornadas laborales de empleados.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `users.id` |
| `action` | text | `start` / `end` |
| `created_at` | timestamptz | |

#### `employee_commissions` (M2)
Registro de comisiones por cita completada.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `appointment_id` | uuid | FK → `appointments.id` |
| `employee_id` | uuid | FK → `users.id` |
| `rate` | numeric | % de comisión aplicado |
| `amount` | numeric | Monto calculado |
| `created_at` | timestamptz | |

#### `loyalty_transactions` (M6)
Historial de puntos de fidelidad por usuario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `users.id` |
| `points` | integer | Delta de puntos (positivo o negativo) |
| `type` | text | `appointment` / `pos` / `adjustment` / `redemption` |
| `description` | text | Descripción legible |
| `created_at` | timestamptz | |

#### `pos_sales` (M7)
Ventas registradas en el punto de venta.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `client_id` | uuid | FK → `users.id` (nullable) |
| `payment_method` | text | `cash` / `card` / `transfer` |
| `subtotal` | numeric | Subtotal antes del descuento |
| `discount` | numeric | Monto de descuento |
| `total` | numeric | Total final |
| `notes` | text | Notas de la venta |
| `created_by` | uuid | FK → `users.id` (admin que registró) |
| `created_at` | timestamptz | |

#### `pos_sale_items` (M7)
Líneas de detalle de cada venta POS.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `sale_id` | uuid | FK → `pos_sales.id` |
| `item_type` | text | `service` / `product` |
| `item_id` | uuid | FK al servicio o producto (nullable) |
| `name` | text | Nombre del ítem |
| `price` | numeric | Precio unitario |
| `quantity` | integer | Cantidad |
| `subtotal` | numeric | precio × cantidad |

#### `low_rating_alerts` (M8)
Alertas generadas cuando un cliente califica con 1 o 2 estrellas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `appointment_id` | uuid | FK → `appointments.id` |
| `client_id` | uuid | FK → `users.id` |
| `employee_id` | uuid | FK → `users.id` |
| `rating` | integer | Calificación (1 o 2) |
| `review_text` | text | Comentario del cliente |
| `is_resolved` | boolean | Si el admin ya resolvió la alerta |
| `resolved_at` | timestamptz | Cuándo fue resuelta |
| `resolved_by` | uuid | FK → `users.id` (quien resolvió) |
| `created_at` | timestamptz | |

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Políticas activas:

| Tabla | Política | Rol | Acción |
|-------|---------|-----|--------|
| `users` | Leer propio perfil | client, employee | SELECT WHERE id = auth.uid() |
| `users` | Leer todos | admin | SELECT (sin filtro) |
| `appointments` | Ver propias citas | client | SELECT WHERE client_id = auth.uid() |
| `appointments` | Ver citas asignadas | employee | SELECT WHERE barber_id = auth.uid() |
| `appointments` | CRUD completo | admin | SELECT, INSERT, UPDATE, DELETE |
| `appointments` | Cancelar propia cita | client | UPDATE WHERE client_id = auth.uid() AND status = 'pending' or 'confirmed' |
| `services` | Leer servicios activos | todos | SELECT WHERE is_active = true |
| `inventory` | CRUD completo | admin | SELECT, INSERT, UPDATE, DELETE |

---

## 6. Autenticación y roles

### Clientes Supabase en server-side

El proyecto usa **dos clientes distintos** para el servidor:

**`createServerSupabaseClient()` — `lib/supabase/server.ts`**
- Usa la `anon key`
- Respeta las políticas RLS
- Para todas las operaciones normales (leer, insertar citas de usuarios autenticados)

**`createAdminSupabaseClient()` — `lib/supabase/server.ts`**
- Usa la `service role key`
- **Bypasea RLS** — tiene acceso total
- Solo para operaciones administrativas: crear usuarios en auth, resetear contraseñas, eliminar cuentas
- **Lazy init:** lanza error descriptivo si `SUPABASE_SERVICE_ROLE_KEY` no está configurada en lugar de fallar silenciosamente

```typescript
// ✅ Correcto para rutas admin que necesitan bypass RLS
const supabaseAdmin = createAdminSupabaseClient()

// ✅ Correcto para operaciones normales con RLS
const supabase = createServerSupabaseClient()
```

### Flujo de autenticación

1. Cliente envía credenciales a `POST /api/auth/login`
2. Supabase `auth.signInWithPassword()` devuelve sesión
3. La sesión se persiste en cookies (SSR) y `localStorage`
4. `useAuth()` hook expone `user`, `loading`, `isAdmin`, `isEmployee`, `isClient`
5. `middleware.ts` lee la sesión en cada request protegido

### Roles y su almacenamiento

Los roles se almacenan en `users.role` y se leen al iniciar sesión.

**Archivo:** `hooks/useAuth.tsx`

```typescript
interface AuthState {
  // Objeto usuario de Supabase enriquecido con datos de `users`
  user: (User & { role: string; full_name: string }) | null

  // true mientras se verifica la sesión inicial (evita flash de login)
  loading: boolean

  // Atajos de rol para renderizado condicional en componentes
  isAdmin: boolean     // user?.role === 'admin'
  isEmployee: boolean  // user?.role === 'employee'
  isClient: boolean    // user?.role === 'client'
}
```

**Uso típico en componentes:**

```typescript
const { user, isAdmin, isEmployee, isClient, loading } = useAuth()

if (loading) return <Spinner />
if (!user) return <Redirect to="/auth/login" />

// Renderizado condicional por rol:
{isAdmin && <AdminPanel />}
{isEmployee && <EmployeeView />}
{isClient && <ClientView />}
```

> `useAuth` NO reemplaza al middleware — es solo para la UI. El control de acceso real ocurre en el servidor.

---

## 7. Middleware y control de acceso

**Archivo:** `middleware.ts`

### Rutas por categoría de acceso

#### Rutas exclusivas por rol

| Prefijo | Rol permitido | Redirige a si otro rol accede |
|---------|--------------|-------------------------------|
| `/admin/*` | `admin` | `/dashboard` |
| `/barber/*` | `employee` | `/dashboard` |
| `/client/*` | `client` | `/dashboard` |

#### Rutas genéricas protegidas (cualquier sesión activa)

```
/dashboard     ← dispatcher; redirige según rol
/employee/*    ← alias heredado, mismo acceso que /barber/*
```

#### Rutas públicas (sin sesión requerida)

```
/                     ← landing page
/auth/login
/auth/register
/auth/forgot-password
/auth/callback        ← magic link / OAuth callback
/reservar             ← reserva pública sin cuenta
/book/[slug]          ← reserva por enlace compartido
/terms
/privacy
/api/*                ← cada endpoint valida rol internamente
```

### Matriz de redirecciones por rol

| Rol | Ruta intentada | Resultado |
|-----|---------------|----------|
| `admin` | `/admin/*` | ✅ Acceso permitido |
| `admin` | `/barber/*` o `/client/*` | 🔄 Redirect → `/dashboard` → `/admin` |
| `employee` | `/barber/*` | ✅ Acceso permitido |
| `employee` | `/admin/*` o `/client/*` | 🔄 Redirect → `/dashboard` → `/barber` |
| `client` | `/client/*` | ✅ Acceso permitido |
| `client` | `/admin/*` o `/barber/*` | 🔄 Redirect → `/dashboard` → `/client` |
| sin sesión | cualquier ruta protegida | 🔄 Redirect → `/auth/login?next={ruta}` |

### `/dashboard` — Dispatcher de roles

La ruta `/dashboard` no tiene UI propia; detecta el rol y redirige en el servidor:

```
admin    → /admin
employee → /barber
client   → /client
```

---

## 8. API Endpoints

### Autenticación 

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | No | Login con email/contraseña |
| `/api/auth/register` | POST | No | Registro de nuevo usuario |
| `/api/auth/logout` | POST | Sí | Cierre de sesión |
| `/api/auth/forgot-password` | POST | No | Solicitar email de recuperación de contraseña |
| `/api/auth/callback` | GET | No | Callback OAuth / magic link de Supabase |

**POST `/api/auth/login`**

Body:
```json
{
  "email": "string",
  "password": "string"
}
```

Respuesta exitosa:
```json
{
  "user": { "id": "uuid", "role": "admin|employee|client", ... },
  "session": { ... }
}
```

Rate limit: `loginLimiter` (máx. 5 intentos / 15 min por IP)

---

### Citas

| Endpoint | Método | Auth | Rol | Descripción |
|----------|--------|------|-----|-------------|
| `/api/appointments` | POST | Sí | any | Crear cita (usuario autenticado) |
| `/api/appointments/admin` | POST | Sí | admin | Admin crea cita con validación estricta |
| `/api/appointments/[id]/cancel` | POST | Sí | client, admin | Cancelar una cita |
| `/api/appointments/[id]/reschedule` | POST | Sí | client, admin | Reagendar una cita (fecha/hora) |
| `/api/appointments/[id]/rate` | POST | Sí | client | Calificar una cita completada (1-5) |

**POST `/api/appointments`**

Body:
```json
{
  "client_id": "uuid",
  "barber_id": "uuid",
  "service_id": "uuid",
  "appointment_date": "YYYY-MM-DD",
  "appointment_time": "HH:MM",
  "notes": "string (opcional)"
}
```

Respuesta exitosa (201):
```json
{
  "success": true,
  "appointment": { ... },
  "message": "Cita creada exitosamente"
}
```

Rate limit: `strictLimiter` (muy estricto — anti-abuso)

**POST `/api/appointments/admin`**

Body (Zod `appointmentAdminSchema`):
```json
{
  "client_id": "uuid",
  "barber_id": "uuid",
  "service_id": "uuid",
  "appointment_date": "YYYY-MM-DD",
  "appointment_time": "HH:MM",
  "status": "pending|confirmed|completed|cancelled (opcional)",
  "notes": "string máx 500 chars (opcional)"
}
```

**POST `/api/appointments/[id]/cancel`**

Body:
```json
{
  "reason": "string (opcional)"
}
```

---

### Reservas públicas

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/bookings/public` | POST | No | Reserva sin login |
| `/api/bookings/public` | GET | No | Disponibilidad pública |

**POST `/api/bookings/public`**

Body:
```json
{
  "barbershop": "string",
  "clientId": "uuid (opcional)",
  "clientName": "string",
  "clientPhone": "string",
  "clientEmail": "string",
  "serviceId": "uuid",
  "serviceName": "string",
  "employeeId": "uuid",
  "appointmentDate": "YYYY-MM-DD",
  "appointmentTime": "HH:MM"
}
```

Comportamiento especial:
- Si `NEXT_PUBLIC_SUPABASE_URL` no está configurado → responde con `200 + demo booking`
- Si `createAdminSupabaseClient()` falla → `500` con mensaje descriptivo

---

### Empleados

| Endpoint | Método | Auth | Rol | Descripción |
|----------|--------|------|-----|-------------|
| `/api/employees` | POST | Sí | admin | Crear empleado |
| `/api/employees` | PATCH | Sí | admin | Resetear contraseña |
| `/api/employees` | DELETE | Sí | admin | Eliminar empleado |

**POST `/api/employees`** — Crear empleado

Body:
```json
{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "role": "employee",
  "specialty": "string"
}
```

Flujo interno:
1. `createAdminSupabaseClient()` (lazy, puede lanzar 500 si falta service role key)
2. `supabaseAdmin.auth.admin.createUser()` con password temporal `Barber{random}!`
3. Inserta en tabla `users`
4. Responde con `{ employee, tempPassword }`

**PATCH `/api/employees`** — Resetear contraseña

Body: `{ "id": "uuid" }`

Respuesta: `{ "tempPassword": "string" }`

**DELETE `/api/employees`**

Query param: `?id=uuid`

---

### Clientes

| Endpoint | Método | Auth | Rol | Descripción |
|----------|--------|------|-----|-------------|
| `/api/clients` | POST | Sí | admin | Crear cliente |
| `/api/clients` | PATCH | Sí | admin | Actualizar cliente |
| `/api/clients` | DELETE | Sí | admin | Eliminar cliente |

---

### Asistencia / Jornada laboral (M3)

| Endpoint | Método | Auth | Rol | Descripción |
|----------|--------|------|-----|-------------|
| `/api/attendance` | GET | Sí | employee | Obtener estado actual de jornada |
| `/api/attendance` | POST | Sí | employee | Registrar inicio o fin de jornada |

**POST `/api/attendance`**

Body:
```json
{ "action": "start" | "end" }
```

---

### Puntos de fidelidad (M6)

| Endpoint | Método | Auth | Rol | Descripción |
|----------|--------|------|-----|-------------|
| `/api/loyalty` | GET | Sí | client, admin | Saldo y últimas 5 transacciones |
| `/api/loyalty` | POST | Sí | admin | Ajuste manual de puntos |

**POST `/api/loyalty`**

Body:
```json
{
  "user_id": "uuid",
  "points": "integer (positivo o negativo)",
  "description": "string"
}
```

---

### Punto de venta (M7)

| Endpoint | Método | Auth | Rol | Descripción |
|----------|--------|------|-----|-------------|
| `/api/pos` | GET | Sí | admin | Historial de ventas POS |
| `/api/pos` | POST | Sí | admin | Registrar nueva venta POS |

**POST `/api/pos`**

Body:
```json
{
  "client_id": "uuid (opcional)",
  "payment_method": "cash | card | transfer",
  "items": [
    { "item_type": "service|product", "item_id": "uuid (opcional)", "name": "string", "price": 0, "quantity": 1 }
  ],
  "discount": 0,
  "notes": "string (opcional)"
}
```

---

### Alertas de calificación baja (M8)

| Endpoint | Método | Auth | Rol | Descripción |
|----------|--------|------|-----|-------------|
| `/api/alerts` | GET | Sí | admin | Listar alertas sin resolver (o todas con `?resolved=true`) |
| `/api/alerts` | PATCH | Sí | admin | Marcar alerta como resuelta |

**PATCH `/api/alerts`**

Body:
```json
{ "id": "uuid", "is_resolved": true }
```

---

## 9. Rate limiting

**Archivo:** `lib/rate-limit.ts`

### Limiters disponibles

| Limiter | Descripción | Ventana | Límite |
|---------|-------------|---------|--------|
| `loginLimiter` | Para `/api/auth/login` | 15 min | 5 intentos / IP |
| `apiLimiter` | Para endpoints generales | 1 min | 60 req / IP |
| `bookingLimiter` | Para reservas | 1 hora | 10 reservas / IP |
| `strictLimiter` | Para crear citas | 1 hora | 5 req / IP |

### Backends

**Upstash Redis (producción recomendado)**

Si `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` están configurados:
- Se usa `@upstash/ratelimit` con ventana deslizante
- Persistente entre instancias serverless
- Clustering-safe

**In-Memory (fallback)**

Si las variables de Upstash no están configuradas:
- Rate limit en memoria del proceso
- Muestra `console.warn` en producción
- **No recomendado en producción:** no persiste entre deployments ni múltiples instancias

### Key del rate limit

```
{APP_ENV|NODE_ENV|'dev'}:ip:{ip_real_del_cliente}
```

La IP se extrae con `getClientIP()` en este orden de prioridad:
1. `x-real-ip`
2. `x-forwarded-for` (primera IP)
3. `127.0.0.1` (fallback)

### Uso en API routes

```typescript
import { withRateLimit, loginLimiter } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIP(request)
  const rateLimitResult = await withRateLimit(loginLimiter, ip)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  // ... resto del handler
}
```

---

## 10. Modo demo

**Archivo:** `lib/demo-config.ts`

El modo demo se activa automáticamente cuando **Supabase no está configurado**. Permite explorar la app sin base de datos.

### Detección del modo demo

```typescript
// lib/demo-config.ts
export const isDemoMode = (): boolean =>
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === ''
```

### Datos de demo incluidos

| Dataset | Contenido |
|---------|-----------|
| `DEMO_APPOINTMENTS` | 14 citas con fechas dinámicas |
| `DEMO_EMPLOYEES` | 3 barberos (Carlos, Ana, Miguel) |
| `DEMO_CLIENTS` | 5 clientes |
| `DEMO_SERVICES` | 6 servicios (corte, barba, corte+barba, etc.) |
| `DEMO_INVENTORY` | 8 productos (shampoo, cera, tijeras, etc.) |
| `DEMO_STATS` | Estadísticas del dashboard hardcodeadas |

### Comportamiento del modo demo

- Formularios aparentan guardar pero no persisten
- Reservas públicas generan una reserva ficticia exitosa
- El login acepta las credenciales demo (`admin@demo.com`, `barber@demo.com`, `client@demo.com`)
- Las API routes que detectan `isDemoMode()` devuelven datos demo en lugar de consultar Supabase

---

## 11. Seguridad

### OWASP Top 10 — Mitigaciones implementadas

| Riesgo | Mitigación |
|--------|-----------|
| Injection | Supabase parametriza todas las queries; detección de SQL injection en login |
| Broken Auth | Supabase JWT + refresh tokens; cookies httpOnly; rate limiting en login |
| Sensitive Data | `SUPABASE_SERVICE_ROLE_KEY` solo en server-side; `.env.local` en `.gitignore` |
| Broken Access Control | RLS en todas las tablas; middleware de roles; validación de rol en cada API route |
| Security Misconfig | `security-headers.ts` configura CSP, HSTS, X-Frame-Options, etc. |
| XSS | Next.js escapa outputs por defecto; CSP restrictivo |
| CSRF | Tokens JWT en headers (no cookies); misma-origin policy |
| Logging | `security-logger.ts` registra intentos fallidos y eventos de seguridad |

### Headers de seguridad

Configurados en `lib/security-headers.ts` y aplicados desde `next.config.mjs`:

```
Content-Security-Policy
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy
Strict-Transport-Security (HSTS)
```

### Rotación de secrets

Ver `docs/SECRET-ROTATION.md` para el procedimiento completo de rotación de `SUPABASE_SERVICE_ROLE_KEY` y otros secrets.

### Pre-commit hooks

```bash
pnpm run setup-hooks
```

Configura hooks que ejecutan:
- Validación de entorno
- Chequeo de seguridad (`pre-commit-security.js`)
- Scan de dependencias

---

## 12. Scripts de base de datos

**Ubicación:** `scripts/` — ejecutar en el **SQL Editor de Supabase** en orden numérico.

| Script | Descripción |
|--------|-------------|
| `00-reset-database.sql` | ⚠️ Limpia toda la base de datos |
| `01-create-tables.sql` | Crea todas las tablas (users, services, appointments, inventory) |
| `02-seed-data.sql` | Datos iniciales de ejemplo |
| `03-create-demo-users.sql` | Crea los 3 usuarios demo |
| `04-fix-auth-policies.sql` | Corrige políticas de auth |
| `05-confirm-user.sql` | Confirma manualmente un usuario |
| `06-delete-user.sql` | Helper para eliminar usuario |
| `07-create-missing-profile.sql` | Crea profile si falta |
| `08-add-specialty-column.sql` | Migración: columna `specialty` en users |
| `09-add-category-to-inventory.sql` | Migración: columna `category` en inventory |
| `10-fix-rls-policies.sql` | Reaplica RLS correctamente |
| `11-fix-users-rls-no-recursion.sql` | Fix: evita recursión infinita en RLS |
| `12-add-admin-notes.sql` | Migración: columna `admin_notes` en appointments |
| `13-seed-services-inventory.sql` | Seed de servicios e inventario |
| `14-rls-employees-read.sql` | RLS: empleados pueden leerse entre sí |
| `15-rls-inventory-read.sql` | RLS: empleados leen inventario |
| `16-client-messages-gifts.sql` | Tablas para mensajes y regalos de clientes |
| `17-appointment-status-guard.sql` | Guard: previene cambios de status inválidos |
| `18-rls-client-cancel.sql` | RLS: clientes pueden cancelar sus propias citas |
| `19-business-settings-rls-and-seed.sql` | Configuración del negocio y RLS |
| `20-add-specialty-enum.sql` | Migación: enum de especialidades |
| `21-add-ratings-to-appointments.sql` | M5: columnas `rating`, `review_text` en appointments |
| `22-add-commission-system.sql` | M2: tabla `employee_commissions`, columna `commission_rate` en users, trigger automático |
| `23-add-attendance-logs.sql` | M3: tabla `attendance_logs` para persistencia de jornada laboral |
| `24-add-loyalty-points.sql` | M6: columna `loyalty_points` en users, tabla `loyalty_transactions` |
| `25-add-pos-system.sql` | M7: tablas `pos_sales` y `pos_sale_items` |
| `26-add-low-rating-alerts.sql` | M8: tabla `low_rating_alerts` + trigger `trg_low_rating_alert` |

### Instalación inicial limpia

```sql
-- En el SQL Editor de Supabase, ejecutar en orden:
-- 01-create-tables.sql
-- 02-seed-data.sql
-- 03-create-demo-users.sql
-- 04-fix-auth-policies.sql
-- 10-fix-rls-policies.sql
-- 11-fix-users-rls-no-recursion.sql
-- 13-seed-services-inventory.sql
-- 14-rls-employees-read.sql
-- 15-rls-inventory-read.sql
-- 16-client-messages-gifts.sql
-- 17-appointment-status-guard.sql
-- 18-rls-client-cancel.sql
```

---

## 13. Despliegue en Vercel

### Configuración en `vercel.json`

El archivo `vercel.json` está configurado con:
- Headers de seguridad en todas las rutas
- Región de despliegue

### Pasos de despliegue

1. Conectar el repositorio en Vercel
2. Configurar todas las variables de entorno en el panel de Vercel
3. Ejecutar `pnpm run predeploy` localmente antes del primer deploy
4. Hacer push a `main` — Vercel despliega automáticamente

### Checklist pre-deploy

```bash
pnpm run predeploy
```

Este comando ejecuta:
1. Validación de variables de entorno
2. Chequeo de seguridad
3. Type check
4. Lint

Ver `docs/SECURITY-CHECKLIST.md` para el checklist completo.

---

## 14. Comandos de desarrollo

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev` | Servidor de desarrollo en `localhost:3000` |
| `pnpm run build` | Build de producción |
| `pnpm run start` | Servidor de producción (requiere build previo) |
| `pnpm run lint` | Ejecuta ESLint |
| `pnpm run type-check` | Verificación de tipos TypeScript (sin emitir) |
| `pnpm run format` | Formatea el código con Prettier |
| `pnpm run validate-env` | Valida variables de entorno |
| `pnpm run security-check` | Chequeo de seguridad completo |
| `pnpm run setup-hooks` | Configura git hooks |
| `pnpm run predeploy` | Checklist completo antes de deploy |
| `pnpm test` | Tests unitarios con Vitest |
| `pnpm run test:e2e` | Tests end-to-end con Playwright |

---

## 15. Troubleshooting

### "Missing Supabase admin environment variables"

```
Error 500: Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY
```

**Causa:** El endpoint admin intentó inicializar el cliente admin y falta una variable de entorno.  
**Solución:** Verificar que `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén configuradas en `.env.local` (desarrollo) o en las variables de entorno de Vercel (producción).

---

### "Too Many Requests" (429)

**Causa:** El rate limiter bloqueó la IP por exceso de requests.  
**Solución en desarrollo:** Reiniciar el servidor de desarrollo. En producción, esperar que expire la ventana.

---

### El dashboard muestra datos demo aunque Supabase está configurado

**Causa 1:** El componente detectó que `isDemoMode()` es `true`.  
**Verificación:** Confirmar que `NEXT_PUBLIC_SUPABASE_URL` en `.env.local` tiene el valor correcto y no está vacío o como placeholder.

**Causa 2:** El usuario demo está hardcodeado y bypasea Supabase.  
**Verificación:** Asegurarse de que el login fue con credenciales reales, no con `admin@demo.com`.

---

### Recursión infinita en RLS

```
ERROR: infinite recursion detected in policy for relation "users"
```

**Causa:** Una política RLS de `users` consulta la misma tabla `users` para verificar el rol.  
**Solución:** Ejecutar `scripts/11-fix-users-rls-no-recursion.sql` en el SQL Editor de Supabase.

---

### Error de tipo en `@upstash/ratelimit`

Si aparece un error de tipos con `@upstash/ratelimit`:

```bash
pnpm install @upstash/ratelimit@^2.0.5 @upstash/redis@^1.34.3
```

El archivo `lib/rate-limit.ts` usa `any` para el tipo del limiter Upstash con un import dinámico — esto es intencional para evitar problemas de compilación y está documentado con un `eslint-disable` comment.

---

### Tests E2E fallan

```bash
# Asegurarse de tener el servidor corriendo
pnpm run dev

# En otra terminal
pnpm run test:e2e
```

Los tests E2E requieren que el servidor esté corriendo en `localhost:3000`. Configurar en `playwright.config.ts` si el puerto es diferente.
