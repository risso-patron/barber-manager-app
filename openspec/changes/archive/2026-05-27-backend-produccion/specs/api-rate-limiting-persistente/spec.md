# Spec: api-rate-limiting-persistente

## ADDED Requirements

### Requirement: Rate limiting persistente entre invocaciones serverless

El sistema DEBE limitar el número de requests por IP usando un almacén externo (Upstash Redis)
que persista entre cold starts y múltiples instancias de la función serverless.

El sistema DEBE soportar un modo de fallback en memoria cuando las credenciales de Upstash
no estén configuradas (entornos de desarrollo local y demo mode).

El sistema DEBE prefixar las claves de rate limiting con el entorno (`APP_ENV`) para evitar
colisiones entre producción y staging.

#### Scenario: Request dentro del límite en producción (Upstash activo)

- GIVEN el entorno tiene `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` configurados
- WHEN una IP realiza requests dentro del umbral permitido
- THEN el sistema permite el request y devuelve los headers `X-RateLimit-Remaining`
- AND el contador se persiste en Upstash Redis

#### Scenario: Request excede el límite en producción

- GIVEN el entorno tiene Upstash configurado
- WHEN una IP supera el máximo de requests en la ventana de tiempo
- THEN el sistema rechaza el request con status `429 Too Many Requests`
- AND responde con el header `Retry-After` indicando cuándo se resetea el contador
- AND el rechazo persiste aunque la instancia serverless haga cold start

#### Scenario: Fallback a limiter en memoria (Upstash no configurado)

- GIVEN el entorno NO tiene `UPSTASH_REDIS_REST_URL` o `UPSTASH_REDIS_REST_TOKEN`
- WHEN se inicializa el rate limiter
- THEN el sistema usa el limiter en memoria (Map)
- AND emite un warning en logs: `Rate limiter en memoria activo — no usar en producción`
- AND el comportamiento de rate limiting es funcionalmente equivalente al modo Upstash

#### Scenario: Entorno de demo mode

- GIVEN `isDemoMode()` retorna `true` (Supabase no configurado)
- WHEN se realiza cualquier request a un endpoint con rate limiting
- THEN el rate limiter en memoria aplica normalmente
- AND no se intenta conectar a Upstash
