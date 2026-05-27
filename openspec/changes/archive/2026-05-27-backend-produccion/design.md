# Design: backend-produccion

## Technical Approach

Tres cambios quirúrgicos e independientes en la capa backend, sin refactorizaciones amplias
ni cambios de esquema de base de datos. Cada uno puede implementarse y revertirse de forma
aislada.

1. **Helper lazy para Supabase admin** — extraer la construcción del cliente admin a una
   función en `lib/supabase/server.ts`, eliminando la instanciación module-level en 4 routes.
2. **POST /api/appointments funcional** — reemplazar el stub 501 con una inserción real,
   usando el cliente de usuario (anon) para respetar RLS.
3. **Rate limiter Upstash** — wrapper en `lib/rate-limit.ts` que usa Upstash cuando las
   credenciales están presentes, con fallback transparente al limiter en memoria.

---

## Architecture Decisions

### Decision: Lazy init para supabaseAdmin

**Choice**: Función `createAdminSupabaseClient()` en `lib/supabase/server.ts` que construye
el cliente al momento de uso.

**Alternatives considered**:
- Mantener la instanciación module-level con guard (`if (!key) throw`) — falla igualmente en
  arranque; no resuelve el problema.
- Helper en archivo separado `lib/supabase/admin.ts` — introduce un archivo nuevo sin ventaja
  real; mejor colocarlo junto al helper server existente.

**Rationale**: La función lazy garantiza que el error sólo ocurre cuando se llama al endpoint
que necesita el cliente admin, no al importar cualquier route que lo use. Simplifica el
diagnóstico y no crashea el proceso en rutas que no lo necesitan.

---

### Decision: Cliente de usuario (anon key) para POST /api/appointments

**Choice**: Usar `createServerSupabaseClient()` (anon key + cookies) para la inserción en la
tabla `appointments`, NO el cliente admin.

**Alternatives considered**:
- Usar `createAdminSupabaseClient()` (service role) — bypasaría RLS; la cita podría
  insertarse aunque el usuario no esté autorizado.

**Rationale**: El cliente anon key heredará la sesión del usuario desde las cookies del
request y las políticas RLS de Supabase decidirán si la inserción es válida. Esto es
exactamente el modelo de seguridad esperado. Los scripts `10-fix-rls-policies.sql` y
`18-rls-client-cancel.sql` ya definen policies para `appointments`; esta implementación
las respeta de forma natural.

---

### Decision: Upstash con fallback en memoria

**Choice**: Detección en runtime basada en la presencia de las variables de entorno
`UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. Si presentes → Upstash. Si no →
`Map` en memoria con warning.

**Alternatives considered**:
- Flag explícito `USE_UPSTASH=true` — más burocracia; la presencia de las credenciales
  es señal suficiente.
- Forzar Upstash en producción sin fallback — rompe dev local; introduce una dependencia
  obligatoria que complica el onboarding.

**Rationale**: El fallback silencioso con warning en logs da la mejor experiencia de
desarrollo sin comprometer producción. En Vercel, la presencia de las env vars activa
automáticamente el modo robusto.

---

## Data Flow

### POST /api/appointments (producción)

```
HTTP POST /api/appointments
        │
        ▼
withRateLimit(request, strictLimiter)   ← lib/rate-limit.ts (Upstash o memoria)
        │
        ▼
validateAppointmentInput(body)          ← lib/validation.ts (Zod)
        │
   valid? ──No──▶  400 { error, details }
        │
       Yes
        │
        ▼
isDemoMode()? ──Yes──▶  Mock response 200
        │
       No
        │
        ▼
createServerSupabaseClient()            ← lib/supabase/server.ts (anon key + cookies)
        │
        ▼
supabase.from('appointments').insert()  ← RLS aplica aquí
        │
   error? ──Yes──▶  500 { error: 'Error interno' }
        │
       No
        │
        ▼
200 { success: true, appointment: data }
```

### createAdminSupabaseClient() — flujo de inicialización lazy

```
Route Handler invoca createAdminSupabaseClient()
        │
        ▼
¿NEXT_PUBLIC_SUPABASE_URL presente? ──No──▶  throw Error('Missing SUPABASE_SERVICE_ROLE_KEY...')
¿SUPABASE_SERVICE_ROLE_KEY presente? ──No──▶  (mismo throw)
        │
       Sí
        │
        ▼
createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
        │
        ▼
Retorna cliente admin (bypasa RLS)
```

### Rate Limiter — selección de backend en startup

```
import { createRateLimiter } from '@/lib/rate-limit'
        │
        ▼
¿UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN?
  ├── Sí ──▶  new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow() })
  └── No  ──▶  InMemoryRateLimiter (Map existente) + console.warn(...)
```

---

## File Changes

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `lib/supabase/server.ts` | Modify | Añadir `createAdminSupabaseClient()` lazy |
| `lib/rate-limit.ts` | Modify | Wrapper Upstash con fallback en memoria; exportar `withRateLimit` refactorizado |
| `lib/env.ts` | Modify | Añadir `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` como opcionales |
| `app/api/appointments/route.ts` | Modify | Reemplazar stub 501 con inserción real via cliente anon |
| `app/api/appointments/admin/route.ts` | Modify | Usar `createAdminSupabaseClient()`; añadir validación Zod al body |
| `app/api/employees/route.ts` | Modify | Usar `createAdminSupabaseClient()` en lugar de `createClient()` inline |
| `app/api/clients/route.ts` | Modify | Usar `createAdminSupabaseClient()` en lugar de `createClient()` inline |
| `app/api/bookings/public/route.ts` | Modify | Usar `createAdminSupabaseClient()` en lugar de `createClient()` inline |
| `package.json` | Modify | Añadir `@upstash/ratelimit` y `@upstash/redis` |

---

## Interfaces / Contracts

### `createAdminSupabaseClient()` — nuevo export en `lib/supabase/server.ts`

```typescript
/**
 * Crea un cliente Supabase con service role key (bypasa RLS).
 * Inicialización lazy — lanza si las variables no están definidas.
 * Usar sólo en Route Handlers del servidor, nunca en componentes cliente.
 */
export function createAdminSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
    )
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
```

### `lib/rate-limit.ts` — interfaz pública sin cambios

Los exports `withRateLimit`, `strictLimiter`, `defaultLimiter` mantienen su firma.
El cambio es interno: el `RateLimiter` subyacente es Upstash o `Map` según el entorno.

### `lib/env.ts` — nuevas variables opcionales

```typescript
UPSTASH_REDIS_REST_URL: z.string().url().optional(),
UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
```

### Zod schema para `appointments/admin` body

```typescript
const appointmentAdminSchema = z.object({
  client_id:         z.string().uuid(),
  barber_id:         z.string().uuid(),
  service_id:        z.string().uuid(),
  appointment_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time:  z.string().regex(/^\d{2}:\d{2}$/),
  status:            z.enum(['pending','confirmed','completed','cancelled']).optional(),
  notes:             z.string().max(500).optional(),
})
```

---

## Implementation Notes

- **RLS en `appointments`**: antes de implementar `POST /api/appointments`, verificar que
  el script `10-fix-rls-policies.sql` incluya policy `INSERT` para rol `client`. Si no
  existe, necesita un script SQL adicional fuera del scope de este change.
- **Upstash key prefix**: usar `${process.env.APP_ENV ?? 'dev'}:ip:${ip}` como identificador
  para evitar colisiones entre entornos que compartan la misma base de Redis.
- **`@upstash/redis` vs `ioredis`**: Upstash ofrece `@upstash/redis` con HTTP-based client,
  compatible con Edge Runtime y Vercel Functions sin necesidad de conexiones TCP persistentes.
