# Design: Unificar Auth

> Change: `unificar-auth` | Fecha: 2026-05-27

---

## Technical Approach

El sistema de auth real en runtime funciona así:

```
login-form.tsx ──→ supabase.auth.signInWithPassword() ──→ cookies
                                                              │
dashboard/page.tsx ──→ supabase.auth.getUser() ─────→ rol ──→ redirect
                                                              │
[role]/page ──→ useRequireAuth() ──→ supabase.auth.getUser() ✓
```

`auth.service.ts` y `useAuth.tsx`/`AuthProvider` son un sistema **paralelo no conectado** — sólo usado por `login-form-new.tsx` (archivo muerto). El trabajo concreto es: (1) sanear `auth.service.ts`, (2) eliminar código muerto, (3) blindar el futuro con `AuthProvider`.

---

## Architecture Decisions

| Decisión | Elección | Descartado | Razón |
|----------|----------|------------|-------|
| ¿Reemplazar `useRequireAuth`? | No — ya funciona correctamente | Migrar a `useAuth` | `useRequireAuth` ya separa demo/Supabase limpiamente. Cambiar rompe 8 páginas sin ganancia real ahora |
| ¿Dónde poner `AuthProvider`? | `app/providers.tsx` (`"use client"`) importado en `app/layout.tsx` | Directo en `layout.tsx` | `layout.tsx` es Server Component. El provider debe estar en un wrapper client-only |
| `/reservar` vs `/book/[slug]` | Mantener **ambos** — no son duplicados | Eliminar uno | `/reservar` = CTA genérico del landing (3 links + e2e). `/book/[slug]` = URL compartible personalizada del admin. Scope corregido. |
| `dashboard/layout.tsx` redirect | Sin cambio necesario | Fix `/login` → `/auth/login` | El código actual ya redirige a `/auth/login` en ambos paths. Bug ya no existe. |
| Rollback de `signUp` fallido | Mover a API route server-side | Mantener en `auth.service.ts` (cliente) | `supabase.auth.admin.deleteUser()` requiere `service_role key` — no puede ejecutarse en el browser |

---

## Data Flow

**Demo mode** (sin Supabase env vars):
```
login-form.tsx
  → tryDemoLogin() ── valida contra DEMO_USERS
  → localStorage.setItem("currentUser", ...)
  → /dashboard → lee localStorage → redirect por rol
  → useRequireAuth (demo path) ── lee localStorage ✓
```

**Supabase mode** (env vars presentes):
```
login-form.tsx
  → supabase.auth.signInWithPassword()
  → cookies ←→ middleware (cada request)
  → /dashboard → supabase.auth.getUser() → public.users.role → redirect
  → useRequireAuth (supabase path) → supabase.auth.getUser() ✓
```

**AuthProvider** (future-proofing):
```
app/layout.tsx → <Providers> (client) → <AuthProvider> → {children}
useAuth() disponible en cualquier componente cliente
```

---

## File Changes

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `app/providers.tsx` | Crear | Wrapper `"use client"` con `<AuthProvider>`. Patrón estándar Next.js App Router |
| `app/layout.tsx` | Modificar | Importar y wrappear con `<Providers>` |
| `lib/services/auth.service.ts` | Modificar | Eliminar 8 `console.log`, eliminar `supabase.auth.admin.deleteUser()` del client-side signUp |
| `components/auth/login-form-new.tsx` | Eliminar | Archivo muerto — 0 imports en el proyecto |

**Sin cambios**: `useRequireAuth.ts`, `dashboard/layout.tsx`, `useAuth.tsx`, `/reservar/`, `/book/[slug]/`

---

## Interfaces / Contracts

```tsx
// app/providers.tsx — nuevo archivo
"use client"
import { AuthProvider } from "@/hooks/useAuth"

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
```

```tsx
// app/layout.tsx — cambio mínimo
import { Providers } from "./providers"
// ...
<body ...>
  <Providers>{children}</Providers>
</body>
```

```ts
// auth.service.ts — signUp() fix: eliminar el rollback con admin API
// ANTES (línea ~75):
await supabase.auth.admin.deleteUser(authData.user.id) // ← ELIMINAR

// DESPUÉS: si falla el perfil, retornar error sin intentar borrar el auth user
// (el usuario puede reintentar o el admin limpia manualmente)
return { success: false, error: "Failed to create user profile" }
```

---

## Testing Strategy

| Layer | Qué testear | Enfoque |
|-------|-------------|---------|
| Manual | Login demo (`admin@demo.com`/`Demo1234`) → redirige a `/admin` | Dev server local |
| Manual | Login con Supabase real → redirige por rol | Requiere `.env.local` |
| E2E existente | `e2e/booking.e2e.spec.ts` — `/reservar` sigue funcionando | Playwright |
| Build | `pnpm build` pasa sin errores TS | CI |

No hay tests unitarios en el proyecto actualmente. No se crean nuevos tests en este change.

---

## Migration / Rollout

No requiere migración de datos. Cambios son sólo de código. Los scripts SQL (01–18) ya están aplicados o pendientes de aplicar — fuera del scope de este change.

Orden de aplicación (importante):
1. Crear `providers.tsx` + actualizar `layout.tsx` (más seguro primero)
2. Limpiar `auth.service.ts` (independiente)
3. Eliminar `login-form-new.tsx` (verificar 0 imports antes)

---

## Open Questions

- [ ] ¿Se configura `.env.local` para validar Supabase mode en local antes del merge, o se hace en Vercel directamente?
