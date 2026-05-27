# Especificación: Rate Limiting Persistente

## Requirement: Rate limiting persistente entre invocaciones serverless

El sistema DEBE limitar el número de requests por IP usando un almacén externo (Upstash Redis)
que persista entre cold starts y múltiples instancias de la función serverless.

El sistema DEBE soportar un modo de fallback en memoria cuando las credenciales de Upstash
no estén configuradas (entornos de desarrollo local y demo mode).

El sistema DEBE prefixar las claves de rate limiting con el entorno (`APP_ENV`) para evitar
colisiones entre producción y staging.

## Escenario: Request dentro del límite en producción (Upstash activo)

**Given** el entorno tiene `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` configurados  
**When** una IP realiza requests dentro del umbral permitido  
**Then** el sistema permite el request y devuelve los headers `X-RateLimit-Remaining`  
**And** el contador se persiste en Upstash Redis

## Escenario: Request excede el límite en producción

**Given** el entorno tiene Upstash configurado  
**When** una IP supera el máximo de requests en la ventana de tiempo  
**Then** el sistema rechaza el request con status `429 Too Many Requests`  
**And** responde con el header `Retry-After` indicando cuándo se resetea el contador  
**And** el rechazo persiste aunque la instancia serverless haga cold start

## Escenario: Fallback a limiter en memoria (Upstash no configurado)

**Given** el entorno NO tiene `UPSTASH_REDIS_REST_URL` o `UPSTASH_REDIS_REST_TOKEN`  
**When** se inicializa el rate limiter  
**Then** el sistema usa el limiter en memoria (Map)  
**And** emite un warning en logs: `Rate limiter en memoria activo — no usar en producción`  
**And** el comportamiento de rate limiting es funcionalmente equivalente al modo Upstash

## Escenario: Entorno de demo mode

**Given** `isDemoMode()` retorna `true` (Supabase no configurado)  
**When** se realiza cualquier request a un endpoint con rate limiting  
**Then** el rate limiter en memoria aplica normalmente  
**And** no se intenta conectar a Upstash
