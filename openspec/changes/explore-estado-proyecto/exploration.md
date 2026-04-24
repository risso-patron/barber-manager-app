# Exploration: Estado del Proyecto Barber Manager

> Generado: 2026-04-21 | Modo: hybrid | Proyecto: barber-manager-app

---

## Stack Detectado

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 15.2.4 |
| UI | React | 19 |
| Lenguaje | TypeScript | ^5 |
| Base de datos | Supabase (PostgreSQL) | 2.45.4 |
| Estado global | Zustand | 5.0.2 |
| Formularios | React Hook Form + Zod | 7.54 / ^3.24 |
| UI Components | shadcn/ui + Radix UI | — |
| Estilos | Tailwind CSS | ^3.4 |
| Auth (SSR) | @supabase/ssr | 0.5.2 |
| Deploy | Vercel | — |

---

## Estructura del Proyecto

```
app/
├── page.tsx              ← Landing pública ✅
├── layout.tsx            ← Layout raíz (sin AuthProvider!) ⚠️
├── auth/
│   ├── login/page.tsx    ← Solo importa LoginForm ✅
│   └── register/         ← (existe)
├── dashboard/
│   ├── page.tsx          ← Solo redirige según rol (lee localStorage) ⚠️
│   └── layout.tsx        ← Lee localStorage, no Supabase ⚠️
├── admin/
│   ├── page.tsx          ← Dashboard admin con datos HARDCODEADOS 🔴
│   ├── appointments/     ← page.tsx existe
│   ├── employees/        ← page.tsx existe
│   ├── inventory/        ← page.tsx existe
│   ├── services/         ← page.tsx existe
│   ├── reports/          ← page.tsx existe (19KB!)
│   ├── clients/          ← existe
│   ├── settings/         ← existe
│   └── share/            ← existe
├── barber/
│   ├── page.tsx          ← Dashboard barbero con datos HARDCODEADOS 🔴
│   └── appointments/     ← existe
├── client/
│   ├── page.tsx          ← existe
│   └── appointments/, book/, history/
├── api/
│   ├── appointments/     ← Route handlers existen
│   ├── bookings/         ← existe
│   ├── auth/             ← existe
│   ├── notifications/    ← existe
│   └── test-notifications/ ← (modo dev)
├── book/ y reservar/     ← 2 rutas para lo mismo?? ⚠️
└── privacy/, terms/      ← Páginas legales

components/
├── auth/
│   ├── login-form.tsx        ← Usa useAuth (Supabase-aware) ✅
│   ├── login-form-new.tsx    ← Duplicado abandonado 🔴
│   └── register-form.tsx, terms-modal.tsx
├── layout/
│   ├── sidebar.tsx
│   └── footer.tsx
├── booking/              ← componentes de reserva
├── client/               ← componentes de cliente
├── dashboard/            ← componentes generales
└── ui/                   ← Componentes shadcn/ui

lib/
├── types.ts              ← Tipos básicos ✅
├── store.ts              ← Zustand: minimalista, sin persistencia ⚠️
├── auth.ts               ← Auth server-side (Supabase) ✅
├── services/
│   └── auth.service.ts   ← Modo dual: demo/Supabase ✅ pero con debug logs 🔴
├── demo-config.ts        ← Datos fake para modo demo ⚠️
├── demo-appointments.ts  ← Más datos fake
├── schemas.ts            ← Validación Zod ✅
├── constants.ts, errors.ts, validation.ts ← Utilidades ✅
└── rate-limit.ts, security-*.ts ← Infraestructura de seguridad ✅
```

---

## Estado Actual — Qué Existe Implementado

### ✅ Sí funciona (o está razonablemente completo)
- **Landing page** (`/`) — visual completa, links a login/register/reservar
- **Autenticación dual**: funciona en modo demo (localStorage) y modo Supabase
  - `auth.service.ts` maneja ambos modos con detección automática
  - `useAuth.tsx` hook completo con AuthContext, signIn, signOut, signUp, updateProfile
  - Login form usa Zod + React Hook Form correctamente
- **Middleware de rutas**: protege `/dashboard`, `/admin`, `/barber`, `/client`
  - Hace role-based redirect via Supabase
- **Esquema de DB**: scripts SQL en orden lógico (`01` a `07`), con RLS
- **Tipos** (`lib/types.ts`): bien definidos para User, Appointment, Service, Inventory, TimeLog
- **Seguridad**: rate-limit, security-headers, pre-commit hooks, env validation — bien pensado
- **Páginas admin**: appointments, employees, inventory, services, reports — **existen** como archivos

### ⚠️ Existe pero incompleto o inconsistente
- **Dashboard router** (`/dashboard/page.tsx`): lógica de redirección por rol funciona, pero lee de `localStorage` ignorando Supabase
- **Zustand store** (`lib/store.ts`): muy elemental, no conectado a Supabase, no tiene persistencia
- **Admin pages**: tienen UI pero con datos hardcodeados (`useState` con valores fijos)
- **Barber page**: datos todos hardcodeados, clock-in/out usa `sessionStorage` (se pierde al cerrar tab)

---

## Lo que está Roto / Incompleto

### 🔴 CRÍTICO — El sistema de autenticación está dividido en 2 mundos paralelos

Este es **el problema central** del proyecto. Coexisten dos sistemas de auth incompatibles:

**Sistema 1 — Supabase real** (el "correcto"):
- `lib/auth.ts` → `createServerSupabaseClient()` → para Server Components
- `hooks/useAuth.tsx` → `AuthContext` con `signIn/signOut/signUp` → para Client Components
- `middleware.ts` → verifica sesión Supabase en cada request

**Sistema 2 — localStorage/demo** (el "workaround"):
- `hooks/useRequireAuth.ts` → lee `currentUser` de `localStorage`
- `lib/services/auth.service.ts` → guarda en `localStorage` cuando no hay Supabase URL
- `app/dashboard/layout.tsx` y `page.tsx` → leen `localStorage` directamente
- `app/admin/page.tsx`, `app/barber/page.tsx` → usan `useRequireAuth` (localStorage)

**El resultado**: el `LoginForm` usa `useAuth` (que llama a `auth.service`, que guarda en `localStorage`), pero el `middleware.ts` verifica la sesión de Supabase. Si no hay Supabase configurado, el middleware falla silenciosamente y te deja pasar. Los dashboards leen de `localStorage` pero si hay Supabase, la sesión real está en cookies, no en `localStorage`.

**En producción con Supabase real**: el login funciona, pero el dashboard podría leer un `localStorage` vacío y redirigir al login en un loop, o mostrar `null` user.

### 🔴 CRÍTICO — Todos los dashboards muestran datos hardcodeados

Ningún dashboard conecta con Supabase real:

```tsx
// admin/page.tsx - línea 24
const [stats, setStats] = useState<DashboardStats>({
  totalAppointments: 156,   // ← hardcodeado
  todayAppointments: 12,    // ← hardcodeado
  ...
})

// barber/page.tsx - línea 24
const [todayAppointments] = useState<TodayAppointment[]>([
  { id: "1", client: "Juan Pérez", ... },  // ← hardcodeado
])
```

No hay ninguna llamada a Supabase en estas páginas. Los datos son decorativos.

### 🔴 CRÍTICO — `login-form.tsx` usa `useAuth` pero `useAuth` requiere `AuthProvider`

`useAuth` lanza error si no está dentro de `AuthProvider`:
```tsx
// hooks/useAuth.tsx línea 197
if (!context) {
  throw new Error("useAuth must be used inside AuthProvider")
}
```

Pero el `app/layout.tsx` NO tiene `AuthProvider`. Esto **crashea la app** en producción a menos que el error esté siendo silenciado en algún lugar.

### 🔴 CRÍTICO — `auth.service.ts` usa `supabase.auth.admin.deleteUser()` en el cliente

```tsx
// auth.service.ts línea 75 — GRAVE ERROR DE SEGURIDAD
await supabase.auth.admin.deleteUser(authData.user.id)
```

`auth.admin` es una API de servidor que requiere el **service_role key**. Usarla en el cliente con la `anon key` siempre falla, y expone intención de usar privilegios elevados desde el browser.

### 🟡 IMPORTANTE — Rutas duplicadas para reservas

Existen:
- `app/book/` 
- `app/reservar/`

Ambas aparentemente hacen lo mismo (sistema de reservas públicas). No está claro cuál es la final.

### 🟡 IMPORTANTE — `login-form-new.tsx` es un archivo muerto

`components/auth/login-form-new.tsx` existe pero no lo importa nadie. Es una versión alternativa abandonada.

### 🟡 IMPORTANTE — Los `console.log` de debug están en producción

`auth.service.ts` tiene 8+ console.log con emojis que revelan estado interno:
```tsx
console.log("🔍 Auth Service - Supabase URL:", supabaseUrl)  // ← expone URL
console.log("👥 DEMO_USERS:", DEMO_USERS)  // ← expone usuarios demo en prod
```

### 🟡 IMPORTANTE — `useRequireAuth` tiene dependencias vacías (`[]`)

```tsx
// hooks/useRequireAuth.ts línea 60
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []) // Solo ejecutar una vez al montar
```

Ignora warning de ESLint con comentario de supresión. Esto es una señal de que algo está roto en la lógica de dependencias.

### 🟠 MENOR — `lib/store.ts` es un mini-store sin conexión real

El Zustand store maneja `user`, `appointments` e `inventory`, pero nada de la app los escribe ni los lee de Supabase. Es código muerto en el contexto actual.

### 🟠 MENOR — `dashboard/layout.tsx` redirige a `/login` (no `/auth/login`)

```tsx
// dashboard/layout.tsx línea 23-24
router.replace("/login")  // ← RUTA INCORRECTA
```

La ruta correcta es `/auth/login`. Esto genera un 404 si el usuario no autenticado llega por este path.

---

## Deuda Técnica y Arquitectura

### Problema raíz: Scope Creep sin Base de Datos configurada

El proyecto empezó con Supabase como backend, luego se agregó un "modo demo" para poder desarrollar sin configurar Supabase. Este modo demo creció demasiado y se convirtió en la implementación principal, creando una deuda técnica enorme: **la app funciona visualmente pero no tiene datos reales ni autenticación confiable**.

### Inconsistencias de tipado

- `useRequireAuth` retorna `any` (`useState<any>`)
- `handleUpdateProfile` acepta `any`
- El `AuthUser` en `useAuth.tsx` es diferente al `User` en `lib/types.ts`

### Arquitectura de auth confusa

El middleware de Next.js verifica sesión Supabase (cookies), pero los hooks del cliente leen localStorage. Son sistemas paralelos que chocan. En producción solo uno puede "ganar".

---

## Diagnóstico: Por Qué Se Atascó el Proyecto

**El proyecto se atascó porque llegó a un punto donde dos mundos paralelos no podían coexistir.**

1. Empezaste con la arquitectura correcta (Supabase + middleware + server components).
2. Como configurar Supabase es complejo (credenciales, scripts SQL, usuarios demo), creaste un "modo demo" con localStorage para poder ver la UI funcionando.
3. El modo demo se fue expandiendo: primero el login, luego los dashboards, luego los hooks.
4. En algún momento, los datos reales (Supabase) y los datos fake (localStorage) se separaron tanto que cualquier cambio en uno rompía el otro.
5. Los dashboards con datos hardcodeados se veían "funcionando", pero al intentar conectarlos a Supabase real, no había un patrón claro de cómo hacerlo sin romper el modo demo.
6. **El bloqueo mental**: no sabías si estabas construyendo una app con Supabase o un mock. Las dos realidades coexistían y ninguna era completa.

---

## Próximos Pasos Recomendados (Por Prioridad)

### Fase 1 — Unificar Auth (fundamentales antes de todo lo demás)
1. **Configurar Supabase** con `.env.local` real y ejecutar scripts SQL en orden.
2. **Agregar `AuthProvider`** al `app/layout.tsx` para que `useAuth` funcione.
3. **Eliminar el modo demo** de `auth.service.ts` o isolarlo completamente (nunca mezclar con Supabase).
4. **Unificar el hook de auth**: un solo hook (`useAuth`) que use Supabase. Eliminar `useRequireAuth`.
5. **Arreglar** `dashboard/layout.tsx` redirigiendo a `/auth/login` no `/login`.

### Fase 2 — Conectar Datos Reales
6. **Admin dashboard**: reemplazar los `useState` hardcodeados con queries a Supabase.
7. **Barber dashboard**: mismo enfoque, leer citas del día desde Supabase.
8. **Client dashboard**: ídem.

### Fase 3 — Limpiar y Consolidar
9. **Eliminar** `login-form-new.tsx` (muerto).
10. **Decidir** entre `app/book/` y `app/reservar/` — elegir uno y eliminar el otro.
11. **Eliminar** todos los `console.log` de debug en producción.
12. **Tipar correctamente**: eliminar todos los `any` en hooks.
13. **Erradicar** `lib/demo-config.ts` y `lib/demo-appointments.ts` cuando Supabase esté funcionando.

### Fase 4 — Features Reales Pendientes
14. Sistema de booking público (la ruta que quede de book/reservar).
15. CRUD completo de empleados, servicios, inventario.
16. Notificaciones (Twilio/Resend ya están en las deps).

---

## Riesgos

- **Seguridad**: `supabase.auth.admin.deleteUser` en el cliente (fallaría en runtime pero intención preocupante)
- **Loop de redirección**: En producción con Supabase real, el middleware verifica cookies pero los dashboards leen localStorage → posible redirect loop
- **Datos demo en prod**: si la URL de Supabase no está en el `.env`, la app corre en modo demo silenciosamente, con credenciales visibles en código fuente
- **TypeScript loosely typed**: muchos `any` que ocultan errores reales

---

## Ready for Proposal
**Sí** — Con este diagnóstico, el siguiente paso es crear una propuesta de change "unificar-auth" que ataque el problema raíz antes de conectar datos reales.
