# Proposal: backend-produccion

## Intent

El backend de la aplicación tiene tres problemas que lo hacen inoperativo en producción:

1. **`/api/appointments` POST devuelve 501** — el flujo principal de reserva de citas no funciona en producción; sólo opera en modo demo.
2. **`supabaseAdmin` se instancia a nivel de módulo** en cuatro routes (`employees`, `clients`, `appointments/admin`, `bookings/public`), lo que provoca un crash en arranque si `SUPABASE_SERVICE_ROLE_KEY` no está definida, y duplica código sin un patrón unificado.
3. **El rate limiter usa `Map` en memoria** — en un entorno serverless (Vercel), cada invocación es una instancia fresca; el contador se resetea en cada cold start, haciendo la protección ilusoria.

Este change lleva la capa backend a un estado funcional y listo para producción.

## Scope

### In Scope
- Implementar `POST /api/appointments` con escritura real en Supabase (reemplazando el stub 501)
- Crear helper centralizado `createAdminSupabaseClient()` en `lib/supabase/server.ts` y refactorizar los cuatro routes que lo necesitan
- Migrar el rate limiter de `Map` en memoria a Upstash Redis usando `@upstash/ratelimit`
- Añadir validación Zod al body en `appointments/admin/route.ts` (inconsistencia menor detectada en la exploración)

### Out of Scope
- Rediseño del modelo de datos de appointments
- Implementar GET para listar appointments (endpoint no existe aún)
- Migrar la lógica de negocio a una capa de servicios completa (`lib/services/`)
- Implementar notificaciones en tiempo real (WebSocket/Realtime Supabase)

## Capabilities

### New Capabilities
- `api-rate-limiting-persistente`: Rate limiting funcional en serverless via Upstash Redis

### Modified Capabilities
- `booking-crear-cita`: El endpoint POST pasa de stub 501 a escritura real en Supabase
- `empleados-gestion`: Route refactorizado para usar helper centralizado de Supabase admin

## Approach

### 1 — Centralizar Supabase Admin Client
Añadir `createAdminSupabaseClient()` en `lib/supabase/server.ts` como función lazy (no module-level). La función lanza un error explícito si la service role key no está definida. Los routes `employees/route.ts`, `clients/route.ts`, `appointments/admin/route.ts` y `bookings/public/route.ts` pasan a importar este helper en lugar de construir el cliente inline.

### 2 — Implementar POST /api/appointments
Reemplazar el bloque TODO con una llamada real a Supabase:
- Insertar en `appointments` con los datos validados
- Respetar RLS (usar cliente de usuario, no admin, para que las policies apliquen)
- Mantener el modo demo como fallback cuando `isDemoMode()` sea true

### 3 — Rate Limiter con Upstash
Instalar `@upstash/ratelimit` + `@upstash/redis`. Refactorizar `lib/rate-limit.ts` para usar `Ratelimit.slidingWindow()` de Upstash cuando las variables de entorno `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` estén presentes; fallback al limiter en memoria cuando no lo estén (dev local / demo mode).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `lib/supabase/server.ts` | Modified | Añadir `createAdminSupabaseClient()` |
| `lib/rate-limit.ts` | Modified | Migrar a Upstash con fallback en memoria |
| `app/api/appointments/route.ts` | Modified | Implementar escritura real en Supabase |
| `app/api/appointments/admin/route.ts` | Modified | Usar helper centralizado + Zod en body |
| `app/api/employees/route.ts` | Modified | Usar helper centralizado |
| `app/api/clients/route.ts` | Modified | Usar helper centralizado |
| `app/api/bookings/public/route.ts` | Modified | Usar helper centralizado |
| `lib/env.ts` | Modified | Añadir variables Upstash al schema de validación |
| `package.json` | Modified | Añadir `@upstash/ratelimit` + `@upstash/redis` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `SUPABASE_SERVICE_ROLE_KEY` ausente en Vercel env | Med | `createAdminSupabaseClient()` lanza error descriptivo; `validate-env` script falla antes del deploy |
| Upstash no configurado en producción | Med | Fallback automático al limiter en memoria; advertencia en logs |
| RLS blocks en `appointments` para el usuario anon | Low | Revisar policies en scripts SQL existentes (script `10-fix-rls-policies.sql`) antes de implementar |
| Rate limit keys colisionan entre entornos | Low | Prefixar keys con `APP_ENV` (`dev:ip:x.x.x.x` vs `prod:ip:x.x.x.x`) |

## Rollback Plan

1. Los routes afectados sólo cambian la fuente del cliente y la implementación interna — las interfaces HTTP no cambian.
2. Para revertir el rate limiter: eliminar las deps de Upstash y restaurar el export original de `lib/rate-limit.ts`.
3. Para revertir el endpoint de appointments: restaurar el bloque `// TODO` con la respuesta 501.
4. Git: `git revert` o `git checkout main -- <archivos>` son suficientes; no hay migraciones de DB en este change.

## Dependencies

- Cuenta Upstash con una base de datos Redis (plan free suficiente para dev/staging)
- Variables de entorno: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Policies RLS de appointments deben permitir INSERT al usuario autenticado con rol `client` (verificar con script `10-fix-rls-policies.sql`)
