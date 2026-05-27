# Delta Spec: auth-roles

> Change: `unificar-auth` | Fecha: 2026-05-27

---

## MODIFIED Requirements

### Requirement: Login exitoso

El sistema MUST autenticar al usuario vía `supabase.auth.signInWithPassword()` cuando las variables de entorno de Supabase están presentes. Una vez autenticado, la sesión MUST persistir en cookies HTTP gestionadas por `@supabase/ssr` (no en `localStorage`).

El sistema MUST redirigir al usuario a `/dashboard`, que a su vez MUST releer el rol desde `public.users` via Supabase y redirigir a la ruta correspondiente.

(Previously: el sistema redirigía según rol pero podía usar localStorage como fuente del rol, sin garantía de sincronía con la sesión Supabase real)

#### Scenario: Login con credenciales Supabase válidas

- GIVEN el usuario está en `/auth/login` y Supabase está configurado
- WHEN ingresa email y password correctos
- THEN `supabase.auth.signInWithPassword()` retorna sesión
- AND la sesión queda en cookies gestionadas por `@supabase/ssr`
- AND el usuario es redirigido a `/dashboard`

#### Scenario: Dashboard despacha por rol

- GIVEN el usuario fue redirigido a `/dashboard` con sesión activa
- WHEN el componente lee el perfil desde `public.users`
- THEN obtiene el campo `role` del registro de base de datos
- AND redirige: `admin` → `/admin`, `employee` → `/employee/dashboard`, `client` → `/client`

#### Scenario: Login en modo demo (sin Supabase)

- GIVEN `NEXT_PUBLIC_SUPABASE_URL` no está configurado
- WHEN el usuario ingresa `admin@demo.com` / `Demo1234`
- THEN `auth.service.ts` valida contra `DEMO_USERS` y guarda en `localStorage`
- AND el usuario es redirigido a `/dashboard`
- AND el dashboard lee el rol desde `localStorage.currentUser`

#### Scenario: Credenciales inválidas

- GIVEN el usuario ingresa email o password incorrectos
- WHEN se intenta `signInWithPassword()`
- THEN el sistema retorna error
- AND muestra mensaje genérico "Credenciales inválidas" (sin revelar cuál campo es incorrecto)

---

### Requirement: Acceso restringido por rol

El `middleware.ts` MUST ser el guardián primario de rutas protegidas. Verifica la sesión Supabase (cookies) en cada request antes de que el componente cargue.

Los hooks del cliente (ej. `useRequireAuth`) SHOULD verificar la sesión vía `supabase.auth.getUser()` — nunca leyendo `localStorage` cuando Supabase está configurado.

(Previously: `useRequireAuth` leía `localStorage.currentUser` como fuente de autenticación tanto en demo como en modo Supabase real, sin sincronía con el middleware)

#### Scenario: Acceso a ruta admin con rol correcto

- GIVEN el usuario tiene sesión activa con rol `admin`
- WHEN accede a cualquier ruta bajo `/admin`
- THEN el middleware verifica la sesión via cookies y permite el acceso
- AND la página carga correctamente

#### Scenario: Acceso a ruta admin con rol incorrecto

- GIVEN el usuario tiene sesión activa con rol `client`
- WHEN intenta acceder a `/admin`
- THEN el middleware verifica el rol desde `public.users`
- AND redirige a `/dashboard` (que a su vez redirige a `/client`)

#### Scenario: Acceso sin sesión a ruta protegida

- GIVEN el usuario no tiene sesión activa
- WHEN intenta acceder a cualquier ruta bajo `/admin`, `/employee`, `/client`
- THEN el middleware redirige a `/auth/login`
- AND NO redirige a `/login` (que resulta en 404)

#### Scenario: Sesión expirada durante navegación

- GIVEN el usuario tiene sesión activa en una pestaña
- WHEN la sesión expira o es cerrada en otra pestaña
- THEN `supabase.auth.onAuthStateChange` emite evento `SIGNED_OUT`
- AND el hook redirige a `/auth/login`

---

### Requirement: Registro de nuevo cliente

El sistema MUST permitir registro de nuevos clientes via `supabase.auth.signUp()` cuando Supabase está configurado. El perfil en `public.users` MUST crearse en la misma operación.

En modo demo, el registro MUST mostrar mensaje "Registro no disponible en modo demo" sin crashear.

(Previously: sin cambios funcionales, solo que el rollback de `auth.admin.deleteUser` del cliente se elimina — era un bug silencioso)

#### Scenario: Registro exitoso en producción

- GIVEN Supabase está configurado y el email no existe
- WHEN el usuario completa el formulario de registro
- THEN `supabase.auth.signUp()` crea el auth user
- AND se inserta el perfil en `public.users` con `role: 'client'`
- AND el usuario puede hacer login inmediatamente (email_confirm: true en demo users; verificación de email en prod real)

#### Scenario: Registro en modo demo

- GIVEN `NEXT_PUBLIC_SUPABASE_URL` no está configurado
- WHEN el usuario intenta registrarse
- THEN el sistema muestra "Registro no disponible en modo demo"
- AND no genera errores de consola

---

## ADDED Requirements

### Requirement: AuthProvider en el árbol de componentes

El `AuthContext` MUST estar disponible en toda la aplicación. El `app/layout.tsx` MUST incluir `<AuthProvider>` como wrapper de `{children}`.

#### Scenario: Componente usa useAuth correctamente

- GIVEN `<AuthProvider>` está en `app/layout.tsx`
- WHEN cualquier componente cliente llama `useAuth()`
- THEN obtiene `{ user, isLoading, signIn, signOut, ... }` sin lanzar excepción

#### Scenario: AuthProvider ausente (error controlado)

- GIVEN `<AuthProvider>` NO está en el árbol
- WHEN un componente llama `useAuth()`
- THEN lanza `Error("useAuth must be used inside AuthProvider")`
- AND Next.js captura el error y muestra `app/error.tsx`

---

### Requirement: Demo mode explícito y aislado

El modo demo MUST activarse únicamente cuando `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY` no estén definidos. Este comportamiento MUST estar encapsulado en `auth.service.ts` — nunca en hooks de React ni en layouts.

#### Scenario: Detección de modo demo

- GIVEN las variables de entorno de Supabase no están presentes
- WHEN cualquier función de `auth.service.ts` es llamada
- THEN usa `DEMO_USERS` como fuente de datos
- AND guarda estado en `localStorage` bajo la key `currentUser`

#### Scenario: No hay filtración de demo mode a hooks

- GIVEN Supabase está configurado
- WHEN `useRequireAuth` o `useAuth` verifican la sesión
- THEN leen desde `supabase.auth.getUser()` — nunca desde `localStorage`

---

## REMOVED Requirements

### Requirement: localStorage como fuente primaria de sesión

(Reason: `localStorage` no es sincrónico con el middleware ni con el servidor. Era un workaround del modo demo que se filtró a todo el sistema de auth. El middleware ya gestiona protección de rutas via cookies; los hooks deben delegar a Supabase.)
