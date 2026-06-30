# ✅ Security Checklist — Ornō (barber-manager-app)

> Auditado y corregido el 2026-06-30. Correcciones principales: comandos `npm` → `pnpm` (el proyecto usa pnpm 10.14.0); "Supabase Auth implementado" ya no es trabajo futuro, está en el código (pendiente verificar en runtime); fechas y score actualizados. Las marcas `[x]`/`[ ]` reflejan el estado verificado en esta auditoría documental, no una ejecución real de cada ítem salvo que se indique lo contrario.

## 🎯 Pre-Deploy Checklist

### Fase 1: Configuración básica
- [ ] **Environment Variables**
  - [ ] Copiar `.env.local.template` a `.env.local`
  - [ ] Reemplazar todos los placeholders (`tu_`, `NUEVA_`, `NUEVO_`)
  - [ ] Ejecutar `pnpm validate-env` sin errores
  - [ ] Verificar que `.env.local` está en `.gitignore`
  - [ ] Confirmar que `.env.local` NO está tracked en Git

- [ ] **Git Security Hooks**
  - [ ] Ejecutar `pnpm setup-hooks`
  - [ ] Probar con un commit de prueba
  - [ ] Verificar que bloquea `.env.local` si se intenta commitear

- [ ] **Rotación de secrets (CRÍTICO, vencida)**
  - [ ] Rotar Resend API key (`docs/SECRET-ROTATION.md`)
  - [ ] Rotar Twilio Auth Token
  - [ ] Generar nuevo `CRON_SECRET`
  - [ ] Actualizar `.env.local` con las nuevas keys
  - [ ] Verificar con `pnpm validate-env`

### Fase 2: Testing local
- [ ] **Build y type checking**
  - [x] `pnpm type-check` pasa sin errores ✅ (corregido 2026-06-30 — `app/admin/page.tsx:134` y `components/admin/appointments/appointment-modal.tsx:47`, ambos resueltos el mismo día)
  - [x] `pnpm lint` pasa sin errores bloqueantes (solo warnings) ✅ verificado 2026-06-30
  - [ ] `pnpm build` completa exitosamente — no ejecutado en esta auditoría documental

- [ ] **Funcionalidades de seguridad**
  - [ ] Rate limiting funciona en login (5 intentos)
  - [ ] Validación rechaza emails inválidos
  - [ ] Validación rechaza passwords débiles
  - [ ] Intentos de SQL injection son bloqueados
  - [ ] Intentos de XSS son sanitizados

- [ ] **Logging**
  - [ ] Login exitoso genera log
  - [ ] Login fallido genera log
  - [ ] Rate limit excedido genera log
  - [ ] Intento de SQL injection genera alerta

### Fase 3: Configuración del proveedor de hosting

> Este proyecto incluye `vercel.json`, por lo que las referencias a Vercel a continuación son aplicables si se despliega ahí. Si se usa otro proveedor, adaptar los pasos equivalentes.

- [ ] **Environment Variables en el dashboard de hosting**
  - [ ] Agregar todas las variables de `.env.local`
  - [ ] Marcar como "Production" y "Preview" según corresponda
  - [ ] NO agregar secrets de desarrollo

- [ ] **Configuración de deployment**
  - [ ] Framework preset: Next.js
  - [ ] Build command: `pnpm build`
  - [ ] Output directory: `.next`
  - [ ] Install command: `pnpm install`
  - [ ] Node version: 18.x o superior

- [ ] **Security Headers**
  - [ ] Verificar que `vercel.json` está commiteado
  - [ ] Headers configurados correctamente (ver `lib/security-headers.ts`, `next.config.mjs`)

### Fase 4: Verificación post-deploy
- [ ] **Testing funcional**
  - [ ] Sitio carga correctamente
  - [ ] Login funciona (demo y/o Supabase)
  - [ ] Reservas funcionan
  - [ ] Emails se envían (Resend)
  - [ ] WhatsApp se envía (Twilio)

- [ ] **Testing de seguridad**
  - [ ] Probar rate limiting en producción
  - [ ] Verificar headers: https://securityheaders.com
  - [ ] Probar validación de formularios
  - [ ] Intentar acceso no autorizado
  - [ ] Verificar que el middleware protege rutas según rol

- [ ] **Monitoreo**
  - [ ] Configurar alertas en el proveedor de hosting
  - [ ] Configurar alertas en Resend
  - [ ] Configurar alertas en Twilio
  - [ ] Verificar logs del proveedor de hosting

---

## 🔐 Security Hardening Checklist

### Autenticación y autorización
- [x] Rate limiting en login (5 / 15min) ✅
- [x] Password validation (8+ caracteres, mayúscula, minúscula, número) ✅
- [x] Modo Supabase implementado en el código (login, cookies, middleware) ✅ — corrige una afirmación anterior que lo daba como "Fase 2 futura"
- [ ] Verificación de email — no confirmado en esta auditoría, no incluido como afirmación
- [ ] Session timeout explícito — no confirmado en esta auditoría
- [ ] Row Level Security (RLS) verificada en runtime — definida en 31 scripts SQL, no probada contra una instancia real
- [ ] 2FA opcional ⏳ no iniciado
- [ ] Bypass de gating en modo demo resuelto o documentado como limitación aceptada (ver `docs/EXECUTIVE-SUMMARY.md`)
- [ ] Formalizar o eliminar los roles legacy `manager`/`barber` (ver `docs/manuales/manual-sistema.md §6`)

### Validación y sanitización de inputs
- [x] Validación de email ✅
- [x] Validación de teléfono ✅
- [x] Validación de nombre ✅
- [x] Sanitización HTML (prevención XSS) ✅
- [x] Detección de SQL injection ✅
- [x] Validación de fecha/hora ✅
- [x] Validación de UUID ✅

### Rate limiting y prevención de abuso
- [x] Endpoint de login (5/15min) ✅
- [x] Endpoint de citas (10/min) ✅
- [x] API general (60/min) ✅
- [ ] Redis/Upstash para producción ⏳ no iniciado
- [ ] Bloqueo de IP por abuso repetido ⏳ no iniciado

### Security Headers
- [x] Content-Security-Policy ✅
- [x] Strict-Transport-Security ✅
- [x] X-Frame-Options ✅
- [x] X-Content-Type-Options ✅
- [x] X-XSS-Protection ✅
- [x] Referrer-Policy ✅
- [x] Permissions-Policy ✅

### Gestión de secrets
- [x] `.env.local` en `.gitignore` ✅
- [x] Pre-commit hook para bloquear secrets ✅
- [x] Script de validación para detectar secrets expuestos ✅
- [x] Template `.env.local.template` ✅
- [ ] Secrets rotados y no expuestos — 🔴 **vencido**, ver `docs/SECRET-ROTATION.md`
- [ ] Secrets Manager dedicado (AWS/Vercel) ⏳ no iniciado

### Logging y monitoreo
- [x] Security logger implementado (`lib/security-logger.ts`) ✅
- [x] Logging de eventos de login ✅
- [x] Logging de eventos de rate limit ✅
- [x] Logging de intentos de SQL injection ✅
- [ ] Integración con Axiom/Datadog u otro ⏳ no iniciado
- [ ] Alertas a Slack/Discord ⏳ no iniciado
- [ ] Dashboard de seguridad dedicado ⏳ no iniciado

### Manejo de errores
- [x] No revela stack traces en producción ✅
- [x] Mensajes de error genéricos para usuarios ✅
- [x] Errores detallados en logs ✅
- [x] Páginas de error personalizadas (404, 500) ✅

### HTTPS y seguridad de red
- [x] Forzar HTTPS (HSTS) ✅
- [ ] HSTS preload de subdominios ⏳ después de 6 meses con HSTS activo
- [ ] Dominio custom con SSL ⏳ pre-producción
- [ ] WAF (Cloudflare/Vercel) ⏳ no iniciado

### Protección de datos
- [ ] CORS configurado y verificado ⏳ no confirmado en esta auditoría
- [ ] RLS de Supabase verificada en runtime ⏳ pendiente
- [ ] Estrategia de backup ⏳ no documentada
- [ ] Cifrado de datos en reposo ⏳ depende de configuración de Supabase, no verificado
- [ ] Cumplimiento GDPR (si aplica) ⏳ pre-producción

---

## 🚨 Incident Response Checklist

### Detección
- [ ] Revisar métricas del proveedor de hosting
- [ ] Revisar logs de seguridad
- [ ] Verificar facturas de Resend/Twilio
- [ ] Analizar patrones de tráfico

### Contención
- [ ] Identificar alcance del incidente
- [ ] Rotar secrets comprometidos
- [ ] Bloquear IPs maliciosas
- [ ] Desactivar servicios afectados (temporal)

### Investigación
- [ ] Revisar commits recientes
- [ ] Revisar access logs
- [ ] Identificar vector de ataque
- [ ] Documentar timeline

### Remediación
- [ ] Aplicar parches de seguridad
- [ ] Actualizar dependencias
- [ ] Implementar controles adicionales
- [ ] Probar los fixes

### Comunicación
- [ ] Notificar al equipo
- [ ] Notificar a stakeholders
- [ ] Notificar a usuarios (si aplica)
- [ ] Cumplir obligaciones legales (GDPR, etc.)

### Post-mortem
- [ ] Documentar el incidente
- [ ] Identificar root cause
- [ ] Implementar mejoras
- [ ] Actualizar runbooks

---

## 📊 Compliance Checklist

### GDPR (si aplica en UE)
- [ ] Privacy policy publicada
- [ ] Términos de servicio publicados
- [ ] Banner de consentimiento de cookies
- [ ] Capacidad de exportar datos del usuario
- [ ] Capacidad de eliminar datos del usuario
- [ ] Proceso de notificación de brecha de datos
- [ ] DPO (Data Protection Officer) designado

### Accesibilidad (WCAG 2.1)
- [ ] Contraste de color suficiente
- [ ] Navegación por teclado
- [ ] Compatible con lectores de pantalla
- [ ] Texto alternativo en imágenes
- [ ] Labels correctos en formularios

> Nota: `pnpm lint` reporta warnings de accesibilidad puntuales (ej. anchor sin atributos accesibles en `app/page.tsx`, varias imágenes `<img>` sin optimizar) — no se hizo una auditoría WCAG completa en esta revisión documental.

### Performance
- [ ] Lighthouse score > 90 — no medido en esta auditoría
- [ ] Core Web Vitals — no medido en esta auditoría
- [ ] Imágenes optimizadas — parcialmente; lint señala varios `<img>` sin usar `next/image`
- [ ] Bundle size objetivo — no medido en esta auditoría

---

## 📅 Maintenance Schedule

### Diario
- [ ] Revisar logs de errores
- [ ] Verificar uptime
- [ ] Monitorear uso de APIs

### Semanal
- [ ] Revisar security logs
- [ ] Actualizar dependencias menores
- [ ] Backup de base de datos

### Mensual
- [ ] Actualizar dependencias mayores
- [ ] Revisar facturas de servicios
- [ ] Audit de permisos de usuarios

### Trimestral (cada 90 días)
- [ ] Rotar secrets críticos — 🔴 vencido desde el 27/02/2026, ver `docs/SECRET-ROTATION.md`
- [ ] Security audit completo
- [ ] Penetration testing
- [ ] Revisar y actualizar documentación

### Anual
- [ ] Renovar certificados SSL (automático si se usa Vercel)
- [ ] Compliance audit
- [ ] Disaster recovery drill
- [ ] Capacitación de seguridad del equipo

---

## 🎓 Team Training Checklist

### Developers
- [ ] Leer `SECURITY-REPORT.md`
- [ ] Configurar git hooks (`pnpm setup-hooks`)
- [ ] Entender la implementación de rate limiting
- [ ] Practicar con las funciones de `lib/validation.ts`
- [ ] Conocer el security logger (`lib/security-logger.ts`)

### DevOps
- [ ] Proceso de rotación de secrets
- [ ] Monitoreo y alertas configuradas
- [ ] Runbook de incident response
- [ ] Procedimientos de backup y recovery

### QA
- [ ] Checklist de testing de seguridad
- [ ] Herramientas para testing (Burp Suite, OWASP ZAP)
- [ ] Casos de prueba de seguridad
- [ ] Reporte de vulnerabilidades

---

**Última actualización:** 2026-06-30
**Próxima revisión recomendada:** al rotar los secrets vencidos (los errores de `pnpm type-check` ya se resolvieron el 2026-06-30)
**Mantenido por:** equipo de desarrollo

---

## Quick Reference

```bash
# Antes de empezar
pnpm setup-hooks

# Antes de commitear
pnpm security-check

# Antes de deploy
pnpm validate-env
pnpm type-check
pnpm build

# Después de rotar secrets
pnpm validate-env

# Verificar producción (revisar headers manualmente en la respuesta)
curl -I https://tudominio.com
```

**Score actual (según `SECURITY-REPORT.md`):** 7/10
**Bloqueadores para subir el score:** rotación de secrets vencida, RLS no verificada en runtime (los 2 errores de type-check que figuraban acá se resolvieron el 2026-06-30)
