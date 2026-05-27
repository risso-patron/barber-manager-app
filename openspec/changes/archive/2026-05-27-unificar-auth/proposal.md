# Proposal: Unificar Auth

> Change: `unificar-auth` | Proyecto: barber-manager-app | Fecha: 2026-05-27

---

## Intent

El sistema de autenticación está dividido en **dos mundos paralelos incompatibles**: uno basado en Supabase (cookies, middleware, `useAuth`) y otro en `localStorage` (demo mode, `useRequireAuth`, dashboard layouts). En producción con Supabase real esto genera redirect loops, crashes por `AuthProvider` faltante, y credenciales demo expuestas en el bundle. Necesitamos un único sistema de auth robusto.

---

## Scope

### In Scope
- Agregar `<AuthProvider>` al root layout (`app/layout.tsx`)
- Unificar en un único hook de auth: deprecar `useRequireAuth`, redirigir a `useAuth`
- Corregir `dashboard/layout.tsx`: redirect a `/auth/login` (no `/login`)
- Eliminar `supabase.auth.admin.deleteUser()` del cliente en `auth.service.ts`
- Aislar demo mode en `auth.service.ts` — nunca filtrar a hooks ni layouts
- Eliminar `login-form-new.tsx` (archivo muerto)
- Decidir y consolidar `/book/` vs `/reservar/` — eliminar duplicado
- Limpiar `console.log` de debug en `auth.service.ts`
- Actualizar `lib/store.ts` para usar auth unificada (o marcar como obsoleto)

### Out of Scope
- Notificaciones (email/WhatsApp) — change separado
- CRUD completo de servicios/inventario
- Registro de nuevos usuarios (funciona correctamente)
- Rediseño de UI

---

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `auth-roles`: El comportamiento de auth cambia — sesión por cookies (Supabase) en prod, localStorage solo en demo explícito. Middleware ya lo hace correctamente; se alinean los hooks con él.

---

## Approach

Supabase es la fuente de verdad. El `middleware.ts` ya implementa la arquitectura correcta: verificar sesión por cookies en cada request. Los hooks del cliente deben alinearse:

1. `useAuth` (ya existente, basado en `AuthContext`) se convierte en el único hook de auth
2. `AuthProvider` se agrega al root layout para que `useAuth` esté disponible en toda la app
3. `useRequireAuth` se refactoriza para usar `supabase.auth.getUser()` directamente (ya lo hace, solo necesita eliminar el path localStorage)
4. Demo mode queda **solo** en `auth.service.ts` como fallback controlado — nunca en layouts ni hooks

---

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `app/layout.tsx` | Modificado | Agregar `<AuthProvider>` |
| `app/dashboard/layout.tsx` | Modificado | Fix redirect `/login` → `/auth/login`, eliminar localStorage read |
| `hooks/useAuth.tsx` | Modificado | Verificar que funcione sin localStorage fallback |
| `hooks/useRequireAuth.ts` | Modificado | Eliminar path localStorage, usar solo Supabase |
| `lib/services/auth.service.ts` | Modificado | Aislar demo mode, eliminar `auth.admin.deleteUser`, limpiar logs |
| `components/auth/login-form-new.tsx` | Eliminado | Archivo muerto |
| `app/book/` o `app/reservar/` | Uno eliminado | Consolidar rutas duplicadas |

---

## Risks

| Riesgo | Prob | Mitigación |
|--------|------|------------|
| Demo mode roto al limpiar `useRequireAuth` | Med | Mantener fallback en `auth.service.ts`, testear login demo antes de mergear |
| Redirect loop si `AuthProvider` mal posicionado | Low | Agregar provider wrapping solo páginas protegidas si hay conflicto con layout raíz |
| `login-form-new.tsx` resulta usado en alguna ruta | Low | Grep completo de imports antes de eliminar |

---

## Rollback Plan

Todos los cambios son en archivos de aplicación (no DB, no scripts SQL). Revertir con `git revert` del commit de este change. El demo mode seguirá funcionando si se deshace el aislamiento.

---

## Dependencies

- Supabase `.env.local` configurado con credenciales reales para validar en producción
- Scripts SQL 01–18 ejecutados en la DB de Supabase

---

## Success Criteria

- [ ] `AuthProvider` presente en root layout sin errores
- [ ] Login con `admin@demo.com` / `Demo1234` redirige a `/admin` (demo mode)
- [ ] `useRequireAuth` no lee `localStorage` cuando Supabase está configurado
- [ ] `dashboard/layout.tsx` redirige a `/auth/login` (no 404)
- [ ] `auth.service.ts` sin `auth.admin.deleteUser` ni `console.log` de debug
- [ ] `login-form-new.tsx` eliminado (0 imports en el proyecto)
- [ ] Build pasa sin errores TypeScript
