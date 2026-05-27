# Tasks: backend-produccion

## Phase 1: Infraestructura y dependencias

- [x] 1.1 Instalar dependencias: `pnpm add @upstash/ratelimit @upstash/redis`
- [x] 1.2 Añadir `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` como opcionales en `lib/env.ts` (schema Zod)
- [ ] 1.3 Actualizar `scripts/validate-env.js` para incluir las nuevas variables de Upstash con nota de que son opcionales en dev

## Phase 2: Helper centralizado Supabase Admin

- [x] 2.1 Añadir función `createAdminSupabaseClient()` en `lib/supabase/server.ts` con inicialización lazy y error descriptivo si faltan vars
- [x] 2.2 Refactorizar `app/api/employees/route.ts` — reemplazar `createClient()` module-level por llamadas a `createAdminSupabaseClient()` dentro de cada handler
- [x] 2.3 Refactorizar `app/api/clients/route.ts` — mismo patrón que 2.2
- [x] 2.4 Refactorizar `app/api/appointments/admin/route.ts` — mismo patrón + añadir validación Zod del body con `appointmentAdminSchema`
- [x] 2.5 Refactorizar `app/api/bookings/public/route.ts` — reemplazar `createClient()` module-level por `createAdminSupabaseClient()` dentro del handler

## Phase 3: Rate limiter Upstash

- [x] 3.1 Refactorizar `lib/rate-limit.ts`: añadir función `buildRateLimiter()` que retorna Upstash `Ratelimit` si las env vars están presentes, o el `RateLimiter` en memoria con `console.warn` si no
- [x] 3.2 Actualizar las instancias exportadas (`strictLimiter`, `loginLimiter`, `apiLimiter`, `bookingLimiter`) para usar `buildRateLimiter()`
- [x] 3.3 Añadir prefijo de entorno a las keys: `${process.env.APP_ENV ?? 'dev'}:ip:${ip}` en la función `withRateLimit`
- [x] 3.4 Verificar que los tipos públicos exportados (`withRateLimit`, `strictLimiter`) mantienen la misma firma — sin cambios en los Route Handlers que los consumen

## Phase 4: Endpoint POST /api/appointments

- [x] 4.1 Verificar en `scripts/11-fix-users-rls-no-recursion.sql` que existe policy `INSERT` para rol `client` en la tabla `appointments` — confirmado, no se requiere SQL nuevo
- [x] 4.2 Reemplazar el bloque `// TODO` en `app/api/appointments/route.ts` con inserción real: `createServerSupabaseClient()` → `supabase.from('appointments').insert(appointmentData).select().single()`
- [x] 4.3 Manejar el error de Supabase: si `error`, responder `500` sin exponer el mensaje interno
- [x] 4.4 Mantener el bloque demo mode intacto (sin cambios)

## Phase 5: Verificación

- [x] 5.1 Ejecutar `pnpm type-check` — sin errores nuevos (15 baseline pre-existentes)
- [x] 5.2 Ejecutar `pnpm lint` — sin errores nuevos (lento en WSL/Windows, no bloqueante)
- [ ] 5.3 Ejecutar `pnpm run validate-env` — pasa sin errores en entorno local
- [x] 5.4 Test manual: `POST /api/appointments` en modo demo devuelve 200 con mensaje demo
- [x] 5.5 Test manual: `POST /api/appointments/admin` sin `client_id` devuelve 400 con error Zod
- [x] 5.6 Test manual: arrancar el servidor sin `SUPABASE_SERVICE_ROLE_KEY` y llamar `POST /api/employees` — retorna 500 con mensaje descriptivo (lazy init, sin crash de módulo)
- [x] 5.7 Test manual: sin vars de Upstash, verificar que el warning aparece en logs y los endpoints responden normalmente
