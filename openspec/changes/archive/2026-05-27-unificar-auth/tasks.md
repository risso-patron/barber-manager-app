# Tasks: Unificar Auth

> Change: `unificar-auth` | Fecha: 2026-05-27

---

## Phase 1: Eliminar código muerto

- [x] 1.1 Verificar que `components/auth/login-form-new.tsx` tiene 0 imports
- [x] 1.2 Eliminar el archivo `components/auth/login-form-new.tsx`

---

## Phase 2: Sanear `auth.service.ts`

- [x] 2.1 Eliminar todos los `console.log` de `lib/services/auth.service.ts`
- [x] 2.2 En el método `signUp()` de `lib/services/auth.service.ts`, eliminar la llamada a `supabase.auth.admin.deleteUser(authData.user.id)`
- [x] 2.3 Reemplazar el bloque de rollback por un `return { success: false, error: "Failed to create user profile" }` sin intentar borrar el auth user

---

## Phase 3: Wiring del AuthProvider

- [x] 3.1 Crear `app/providers.tsx`
- [x] 3.2 En `app/layout.tsx`, importar `Providers` desde `"./providers"` y wrappear `{children}` con `<Providers>{children}</Providers>`

---

## Phase 4: Verificación

- [x] 4.1 Ejecutar `pnpm build` — debe pasar sin errores TypeScript
- [ ] 4.2 Verificar login demo: `admin@demo.com / Demo1234` → redirige a `/admin`
- [ ] 4.3 Verificar login demo: `client@demo.com / Demo1234` → redirige a `/client`
- [ ] 4.4 Verificar que `/reservar` sigue funcionando desde el landing page
- [ ] 4.5 Actualizar `openspec/changes/unificar-auth/state.yaml` → `phase: tasks, status: complete, next: apply`
