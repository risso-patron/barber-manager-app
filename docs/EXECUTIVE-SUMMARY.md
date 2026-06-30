# 🎯 Resumen Ejecutivo — Seguridad

**Proyecto:** Ornō (`barber-manager-app`) — `v0.1.0`
**Implementación original:** 29 de noviembre de 2025
**Esta revisión:** 30 de junio de 2026 — auditoría documental contra el código real

---

## ⚠️ Aviso sobre esta revisión

La versión anterior de este documento contenía **fragmentos reales de secrets en texto plano** (Resend API Key, Twilio Auth Token, CRON Secret) en la sección de acciones pendientes. Esos valores fueron **eliminados de este documento** en esta revisión — nunca deben pegarse secrets, ni siquiera truncados, en archivos versionados en git. Si necesitás conocer el estado de rotación de un secret específico, consultá [`docs/SECRET-ROTATION.md`](SECRET-ROTATION.md), que tampoco debe contener valores reales (corregido en la misma fecha).

Esta revisión también corrige afirmaciones de la versión original que ya no son ciertas — el roadmap de noviembre 2025 daba la autenticación con Supabase como trabajo futuro ("Fase 2"); a junio de 2026, el modo dual demo/Supabase **ya está implementado en el código**, aunque su funcionamiento contra una instancia real de Supabase no fue verificado de forma independiente en esta auditoría documental.

---

## 📊 Estado de seguridad (según `SECURITY-REPORT.md`, fuente autoritativa)

| Aspecto | Score | Estado |
|---|---|---|
| Protección de secrets | 6/10 | ⚠️ Rotación pendiente y vencida |
| Rate limiting | 10/10 | ✅ Implementado |
| Input validation | 10/10 | ✅ Implementado |
| Security headers | 10/10 | ✅ Implementado |
| Autenticación | 3/10 (según `SECURITY-REPORT.md`, fechado nov-2025) | 🟡 Ver nota abajo |
| Logging y monitoreo | 8/10 | ✅ Básico implementado |
| Error handling | 9/10 | ✅ Implementado |

**Score global:** 7/10

> 🟡 **Nota de discrepancia detectada en esta auditoría:** el score de Autenticación (3/10, "demo mode only") de `SECURITY-REPORT.md` describe el estado de noviembre 2025. El código actual ya implementa modo dual (demo vía `localStorage` / producción vía Supabase + cookies), por lo que ese número probablemente esté desactualizado. No lo corregimos acá porque `SECURITY-REPORT.md` es la fuente autoritativa de scores de seguridad — la corrección de ese puntaje específico queda pendiente como tarea de la próxima revisión de seguridad (ver `docs/manuales/manual-sistema.md §15`).

---

## ✅ Protecciones implementadas (resumen, sin cambios desde nov-2025)

| Protección | Archivo principal | Qué hace |
|---|---|---|
| Rate limiting | `lib/rate-limit.ts` | 5 intentos de login / 15 min, 60 req/min de API, 10 reservas/hora |
| Validación e input sanitization | `lib/validation.ts` | Valida emails/teléfonos/fechas, sanitiza HTML, detecta SQLi |
| Security headers | `lib/security-headers.ts`, `next.config.mjs` | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| Pre-commit hooks | `scripts/pre-commit-security.js` | Bloquea commits con `.env.local` o keys hardcodeadas |
| Validación de entorno | `lib/env.ts`, `scripts/validate-env.js` | Valida variables al iniciar; `pnpm validate-env` |
| Logging de seguridad | `lib/security-logger.ts` | Logs de login, rate limiting, intentos de XSS/SQLi |

Estas protecciones siguen activas en el código a junio de 2026 — no se detectaron regresiones durante esta auditoría documental.

---

## 🚨 Acciones pendientes (verificado a 2026-06-30)

### 1. Rotar secrets expuestos — **urgente, vencido**

Los siguientes secrets están comprometidos por haber estado en texto plano en el historial de git (en este documento y en `docs/SECRET-ROTATION.md`, ambos corregidos en esta revisión, pero **el historial de git conserva las versiones anteriores**):

- Resend API Key
- Twilio Auth Token
- CRON Secret

Procedimiento completo en [`docs/SECRET-ROTATION.md`](SECRET-ROTATION.md). Tras rotar, validar con `pnpm validate-env`.

> Rotar el valor en el proveedor (Resend/Twilio) **no es suficiente** por sí solo — el valor expuesto sigue siendo recuperable del historial de git mientras no se reescriba ese historial o se considere el repositorio comprometido para esos secrets específicos.

### 2. Configurar git hooks de seguridad (si no están activos)

```bash
pnpm setup-hooks
```

### 3. Verificar el modo producción contra una instancia real de Supabase

A diferencia del roadmap original (que daba esto como trabajo no iniciado), el código **ya contiene** la integración: `@supabase/ssr`, middleware con gating por rol, y 31 scripts SQL con políticas RLS en `scripts/`. Lo que falta, y no se hizo en esta auditoría documental, es **verificar en runtime** que esas políticas se comporten como están escritas contra un proyecto Supabase real.

### 4. Resolver el bypass de control de acceso en modo demo

`middleware.ts` solo aplica gating por rol cuando existe una sesión/cookies de Supabase. En modo demo, el control de acceso es 100% client-side (`useRequireAuth` leyendo `localStorage`) y es evadible editando el storage del navegador. No es un riesgo de producción si el modo demo nunca se expone públicamente con datos reales, pero si se usa para mostrar el producto a un cliente, debe quedar claro que **no es representativo de la seguridad real del sistema**. Detalle en `docs/manuales/manual-sistema.md §11`.

---

## 📈 Roadmap de seguridad (actualizado)

### Fase 1 — Protecciones básicas ✅ Completado (nov-2025)
- [x] Rate limiting, input validation, security headers, pre-commit hooks, validación de entorno, logging

### Fase 2 — Autenticación real 🟡 Parcialmente completado
- [ ] Rotar secrets expuestos (sigue pendiente)
- [x] Modo Supabase implementado en código (login, cookies, middleware)
- [ ] Verificar RLS contra una instancia real
- [ ] Resolver el bypass de middleware en modo demo (o documentar explícitamente que el demo no debe usarse como entorno expuesto)
- [ ] Formalizar o eliminar los roles `manager`/`barber`, hoy fuera del modelo oficial de 3 roles (ver `docs/manuales/manual-sistema.md §6`)

### Fase 3 — Hardening 🔴 No iniciado
- [ ] 2FA opcional
- [ ] WAF
- [ ] Monitoreo de seguridad en producción
- [ ] Penetration testing
- [ ] Completar o retirar `/admin/billing` (stub) e `/admin/integrations` (parcial) antes de cualquier uso comercial real — ver `docs/manuales/manual-admin.md §12` y `§13`

---

## 🎓 Para el equipo

**Desarrollo:**
1. Leer [`SECURITY-REPORT.md`](../SECURITY-REPORT.md) (fuente autoritativa de scores)
2. `pnpm setup-hooks` en la máquina local
3. Usar `lib/validation.ts` para formularios nuevos y `withRateLimit()` en endpoints nuevos

**DevOps:**
1. Rotar secrets siguiendo `docs/SECRET-ROTATION.md`
2. Configurar variables en el dashboard del proveedor de hosting
3. Monitorear métricas de rate limiting

**QA:**
1. Probar validaciones de formularios e intentar bypass de rate limiting
2. Verificar headers con un escáner externo (ej. securityheaders.com)
3. Confirmar que el modo demo no esté expuesto como si fuera producción

---

## ✅ Checklist de deploy

### Pre-deploy
- [ ] `pnpm validate-env` sin errores
- [ ] Secrets rotados (y considerados comprometidos en el historial de git anterior a esta fecha)
- [ ] Git hooks configurados
- [ ] `pnpm type-check` y `pnpm lint` sin errores bloqueantes
- [ ] RLS verificado contra el proyecto Supabase real que se va a usar

### Post-deploy
- [ ] Headers verificados con escáner externo
- [ ] Rate limiting probado en producción
- [ ] Monitoreo/alertas configurados
- [ ] Confirmado que `/admin/billing` e `/admin/integrations` no se presentan como funcionalidades terminadas

---

**Estado del proyecto:** desarrollo activo, no apto para producción sin completar la Fase 2 del roadmap de seguridad y la rotación de secrets.
