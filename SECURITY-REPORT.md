# 🔐 Reporte de Seguridad — Ornō (barber-manager-app)

> **Implementación original**: 29 de noviembre de 2025
> **Esta revisión**: 30 de junio de 2026 — auditoría documental contra el código real
> **Versión de paquete real**: `0.1.0` (`package.json`). La etiqueta "Versión: 1.1.0" de la versión anterior de este documento es un rótulo interno de noviembre 2025, anterior y no relacionado al esquema de milestones `v1.1`/`v1.2`/`v1.3`/`M1`-`M8` usado en `docs/manuales/INDEX.md` — se elimina acá para no generar confusión.
> **Estado**: ✅ Apto para desarrollo | 🔴 No apto para producción (secrets sin rotar, RLS sin verificar en runtime)

---

## ⚠️ Aviso sobre esta revisión

La versión anterior de este documento contenía, en la sección "Vulnerabilidades Críticas", **los tres secrets reales en texto plano** (Resend API Key, Twilio Auth Token, CRON Secret). Fueron **eliminados en esta revisión** — nunca deben volver a pegarse en este archivo. Ver el procedimiento de rotación, sin valores reales, en [`docs/SECRET-ROTATION.md`](docs/SECRET-ROTATION.md).

Esta revisión también corrige una **contradicción interna grave** que tenía la versión anterior: la sección "✅ Implementaciones Completadas" (más abajo) listaba Rate Limiting, Security Headers/CSP y Security Logging como **ya implementados**, mientras que la sección "Vulnerabilidades" del mismo documento los listaba como **ausentes** ("Sin Rate Limiting", "Sin Content Security Policy", "Sin Logging de Seguridad"). Verificado directamente contra `lib/rate-limit.ts`, `lib/security-headers.ts` y `lib/security-logger.ts`: **las tres protecciones están implementadas y activas**. La sección de vulnerabilidades describía, aparentemente, un estado anterior al de la sección de implementaciones y nunca se actualizó — no se corrigió antes porque nadie revisó la consistencia interna del documento. Se corrige acá.

También se corrige el ítem "Middleware de Autenticación Desactivado", verificado directamente contra `middleware.ts` (105 líneas): **el middleware está implementado y activo**, no desactivado — ver detalle en la sección correspondiente.

---

## 📊 Evaluación de seguridad

### 🎯 Security Score: 7/10 (sin cambios numéricos en esta revisión — ver nota sobre Authentication)

| Aspecto | Score | Estado |
|---------|-------|--------|
| **Protección de Secrets** | 6/10 | 🔴 Rotación vencida desde el 27/02/2026 |
| **Rate Limiting** | 10/10 | ✅ Implementado |
| **Input Validation** | 10/10 | ✅ Implementado |
| **Security Headers** | 10/10 | ✅ Implementado |
| **Authentication** | 3/10 (nov-2025) | 🟡 Ver nota abajo — probablemente desactualizado |
| **Logging & Monitoring** | 8/10 | ✅ Básico implementado |
| **Error Handling** | 9/10 | ✅ Implementado |

> 🟡 **Nota sobre el score de Authentication:** el 3/10 ("demo mode only") fue asignado en noviembre de 2025, cuando aparentemente el middleware no aplicaba gating. A junio de 2026, `middleware.ts` está **activo**, usa `@supabase/ssr`, redirige usuarios no autenticados, y aplica reglas de acceso por rol para `/admin`, `/employee`, `/barber` y `/client` (incluyendo reglas específicas para el rol `manager`). Esto sugiere que el score real es más alto que 3/10. **No reasignamos un número nuevo en esta auditoría documental** porque eso requiere una re-evaluación formal de seguridad (incluyendo verificar RLS contra una instancia real de Supabase, cosa que no se hizo acá) — no solo una lectura de código. **Recomendación:** programar una re-auditoría de seguridad que reevalúe específicamente este aspecto antes de la próxima revisión de este documento.

**Mejora desde el estado inicial (28/11/2025):** +75% (4/10 → 7/10)

---

## ✅ Implementaciones completadas

### 1. Rate Limiting System ✅
**Estado**: implementado y activo (verificado 2026-06-30)

**Qué hace**:
- Login: máximo 5 intentos cada 15 minutos
- API general: 60 requests por minuto
- Reservas: 10 por hora
- Respuesta HTTP 429 con header `Retry-After`

**Archivos**:
- `lib/rate-limit.ts` — sistema de rate limiting
- `app/api/auth/login/route.ts` — aplicado
- `app/api/appointments/route.ts` — aplicado

**Impacto**: previene ataques de fuerza bruta y spam.

> Limitación conocida: el rate limiting es en memoria, no distribuido — en un entorno serverless con múltiples instancias, los contadores no se comparten entre instancias. No evaluado como bloqueante en esta auditoría, pero a considerar antes de tráfico de producción alto.

---

### 2. Input Validation & Sanitization ✅
**Estado**: implementado y activo

**Qué hace**:
- Valida emails, teléfonos, nombres, fechas
- Sanitiza HTML (previene XSS)
- Detecta intentos de SQL injection
- Valida passwords seguros

**Archivos**:
- `lib/validation.ts` — funciones de validación
- Aplicado en endpoints API

**Impacto**: previene XSS, SQL injection, y mejora la calidad de los datos.

---

### 3. Security Headers ✅
**Estado**: implementado y activo

**Qué hace**:
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- X-Frame-Options (anti-clickjacking)
- X-Content-Type-Options
- Permissions-Policy

**Archivos**:
- `lib/security-headers.ts` — configuración
- `next.config.mjs` — aplicado globalmente
- `vercel.json` — config de deployment

**Impacto**: protección contra múltiples vectores de ataque.

---

### 4. Security Logging ✅
**Estado**: implementado

**Qué hace**:
- Logs de login (éxito/fallo)
- Logs de rate limiting
- Logs de intentos de SQL injection
- Logs de intentos de XSS
- Alertas para eventos críticos

**Archivos**:
- `lib/security-logger.ts` — logger centralizado
- Integrado en endpoints API

**Impacto**: detección temprana de amenazas y auditoría.

---

### 5. Pre-commit Security Hooks ✅
**Estado**: implementado

**Qué hace**:
- Bloquea commits con `.env.local`
- Detecta API keys hardcodeadas
- Detecta passwords en código
- Instrucciones automáticas de remediación

**Archivos**:
- `scripts/pre-commit-security.js`
- Instalación: `pnpm setup-hooks`

**Impacto**: previene exposición accidental de secrets.

---

### 6. Environment Validation ✅
**Estado**: implementado

**Qué hace**:
- Valida variables de entorno al iniciar
- Detecta secrets expuestos
- Script CLI para validación manual

**Archivos**:
- `lib/env.ts` — validación en runtime
- `scripts/validate-env.js` — CLI tool

**Impacto**: configuración correcta y detección de secrets comprometidos.

---

### 7. Middleware con gating por rol ✅
**Estado**: implementado y activo — **corrige la afirmación de la versión anterior de este documento, que lo daba como "completamente deshabilitado"**

**Qué hace** (verificado contra `middleware.ts`):
- Protege `/dashboard`, `/admin`, `/employee`, `/barber`, `/client` vía `config.matcher`
- Lee la sesión de Supabase desde cookies (`@supabase/ssr`)
- Redirige a `/auth/login` si no hay usuario autenticado en una ruta protegida
- Aplica reglas específicas por rol, incluyendo restricciones particulares para `manager` en `/admin/settings`, `/admin/reports` y `/admin/employees`

🟡 **Comportamiento intencional en modo demo:** si `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` no están configuradas, el middleware hace *pass-through* sin gating, y el control de acceso pasa a ser 100% client-side (`useRequireAuth()` + `localStorage`, evadible desde DevTools). Esto es así por diseño del modo demo — no es una vulnerabilidad si el modo demo nunca se expone con datos reales, pero debe documentarse claramente si se usa para mostrar el producto a un cliente.

---

## 🔴 Vulnerabilidades activas (verificado 2026-06-30)

### 1. Rotación de secrets vencida
**Severidad**: 🔴 CRÍTICA
**Estado**: 🔴 **Pendiente — vencida desde el 27/02/2026**

Tres secrets fueron expuestos en texto plano en el historial de git de este repositorio (en versiones anteriores de este documento y de `docs/SECRET-ROTATION.md`, ambos ya redactados en esta auditoría, **pero el historial de git conserva las versiones anteriores**):
- `TWILIO_AUTH_TOKEN`
- `RESEND_API_KEY`
- `CRON_SECRET`

**Impacto potencial**: uso no autorizado de los servicios (costos), envío de spam desde las cuentas de la barbería, posible acceso indebido según el alcance de cada key.

🔴🔴 **Hallazgo crítico de esta auditoría:** la exposición no es solo histórica. `scripts/validate-env.js` (líneas 145-149) tiene los tres valores reales **hardcodeados en texto plano hoy**, en un archivo trackeado por git (commit `9aaf6dd`, 2026-06-23). Esta auditoría es documental y no modifica código funcional, así que ese archivo **no fue corregido**. Recomendación: reemplazar la comparación por hashes (SHA-256) de los valores filtrados, como tarea de desarrollo aparte — ver detalle en [`docs/SECRET-ROTATION.md`](docs/SECRET-ROTATION.md).

**Solución (rotación)**: seguir el procedimiento completo, sin valores reales, en [`docs/SECRET-ROTATION.md`](docs/SECRET-ROTATION.md).

---

### 2. RLS de Supabase no verificada en runtime
**Severidad**: 🔴 CRÍTICA (si se usa con datos reales sin verificar)
**Estado**: 🟡 Definida en código, no probada

Existen 31 scripts SQL en `scripts/` con políticas de Row Level Security. No se verificó en esta auditoría documental que esas políticas se comporten como están escritas contra un proyecto Supabase real (por ejemplo, que un cliente no pueda leer datos de otro cliente).

**Solución recomendada**: antes de manejar datos reales de un cliente, ejecutar pruebas de RLS contra una instancia real (crear usuarios de prueba con distintos roles e intentar accesos cruzados).

---

### 3. Modo demo sin gating server-side
**Severidad**: 🟡 MEDIA (alta si el demo se expone públicamente con datos reales)
**Estado**: comportamiento intencional, documentado

En modo demo, el control de acceso es 100% client-side y evadible editando `localStorage`. Aceptable para demostraciones internas; **no aceptable** si se usa con datos reales de clientes o se expone sin aclarar que es una demo.

---

### 4. Sin verificación de email obligatoria
**Severidad**: 🟡 MEDIA
**Estado**: 🔴 no confirmado como implementado en esta auditoría

`validateEmail()` en `lib/validation.ts` valida el *formato* del email, pero esto es distinto de confirmar que el usuario es dueño de esa casilla (flujo de verificación por link). No se encontró evidencia de un flujo de verificación de email obligatorio durante esta auditoría.

**Solución**: implementar verificación de email vía Supabase Auth si se requiere antes de producción.

---

### 5. CORS sin configuración explícita
**Severidad**: 🟡 MEDIA
**Estado**: no verificado en esta auditoría

No se confirmó la presencia de headers CORS explícitos en las rutas API. Pendiente de revisión dedicada.

---

## 🛡️ Hoja de ruta de seguridad

### Fase 1 — Protecciones básicas ✅ Completado (nov-2025)
Rate limiting, input validation, security headers (incluyendo CSP), pre-commit hooks, validación de entorno, logging. Todo verificado activo a 2026-06-30.

### Fase 2 — Autenticación real 🟡 Parcialmente completado
- [x] Middleware con gating por rol implementado y activo (corrección de esta auditoría — antes se daba como pendiente)
- [x] Auth con Supabase implementada en código (cookies, server-side, vía `@supabase/ssr`)
- [ ] RLS verificada en runtime contra una instancia real — pendiente
- [ ] Rotar los secrets expuestos — pendiente, vencido
- [ ] Verificación de email obligatoria — no confirmada como implementada
- [ ] Decidir el tratamiento del modo demo en producción (ocultarlo o documentarlo explícitamente como no apto para datos reales)
- [ ] Formalizar o eliminar los roles legacy `manager`/`barber` (ver `docs/manuales/manual-sistema.md §6`) — el middleware ya tiene lógica para `manager`, pero no existe forma de asignar ese rol a un usuario real (sin cuenta demo ni flujo de registro)

### Fase 3 — Hardening 🔴 No iniciado
- [ ] 2FA opcional
- [ ] WAF
- [ ] Rate limiting distribuido (Redis/Upstash) para entornos multi-instancia
- [ ] Monitoreo de seguridad en producción (Axiom/Datadog u otro)
- [ ] Penetration testing
- [ ] Dependency scanning (Dependabot/Snyk)
- [ ] Completar o retirar `/admin/billing` (stub) e `/admin/integrations` (parcial) antes de uso comercial real — ver `docs/manuales/manual-admin.md §12` y `§13`

---

## 📋 Checklist pre-producción

### Crítico (bloqueante)
- [ ] Rotar TODAS las API keys expuestas — vencido
- [x] `.env.local` NO está en Git ✅
- [x] Middleware de autenticación activo ✅ (corregido en esta auditoría)
- [x] Supabase Auth implementado en código ✅
- [ ] RLS verificada en runtime contra una instancia real — pendiente
- [ ] Probar restricciones de roles end-to-end contra una instancia real
- [x] `pnpm type-check` sin errores ✅ (corregido 2026-06-30 — `app/admin/page.tsx:134` y `components/admin/appointments/appointment-modal.tsx:47`, resueltos el mismo día que se documentaron)

### Importante (recomendado)
- [x] Rate limiting implementado ✅
- [ ] Verificación de email obligatoria
- [ ] Configurar CORS explícitamente
- [x] CSP headers ✅ (ya implementado, corrige afirmación anterior)
- [x] Logging de seguridad ✅ (ya implementado, corrige afirmación anterior)
- [ ] Configurar alertas de seguridad en el proveedor de hosting

### Opcional (nice to have)
- [ ] WAF habilitado
- [ ] Penetration testing
- [ ] Bug bounty program
- [ ] Documentación formal de incidentes pasados

---

## 🚨 Plan de respuesta a incidentes

Ver el runbook detallado en [`docs/SECRET-ROTATION.md`](docs/SECRET-ROTATION.md#-qué-hacer-si-sospechás-un-compromiso) — incluye pasos de detección, contención, investigación, notificación y post-mortem. No se duplica acá para evitar que ambos documentos queden desincronizados.

---

## 🎯 Recomendaciones actuales

### Para desarrollo (ahora)
1. **Rotar los secrets vencidos** — ver `docs/SECRET-ROTATION.md`
2. No compartir `.env.local` por ningún canal
3. Corregir `scripts/validate-env.js` y `.env.example` (ambos con secrets reales en código funcional — ver advertencia en `docs/SECRET-ROTATION.md`)

### Para staging / mostrar a clientes
1. Si se usa modo demo, dejar explícito que no es representativo de la seguridad real (gating client-side, evadible)
2. Si se usa modo Supabase, verificar RLS contra esa instancia antes de cargar datos reales

### Para producción
1. Rotar secrets y verificar RLS en runtime — ambos bloqueantes
2. Resolver `/admin/billing` (hoy stub sin backend real) antes de cualquier cobro — ver `docs/manuales/manual-admin.md §12`
3. Configurar monitoreo y alertas
4. Plan de backup de datos (no documentado actualmente)

---

## 📞 Contacto de seguridad

**Security Contact**: luisrissopa@gmail.com
**Responsible Disclosure**: reportar vulnerabilidades vía email
**Response Time**: < 48 horas

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist#security)
- [Supabase Security](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Vercel Security](https://vercel.com/docs/security/overview)

---

**Última actualización**: 2026-06-30
**Próxima revisión recomendada**: tras rotar los secrets y verificar RLS en runtime — y debería incluir una re-evaluación formal del score de Authentication
