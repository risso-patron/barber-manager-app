# 📚 Índice de Documentación de Seguridad

Esta carpeta contiene la documentación de seguridad de Ornō (`barber-manager-app`).

> Auditado y corregido el 2026-06-30. Corrige comandos (`npm` → `pnpm`), la descripción del contenido de `EXECUTIVE-SUMMARY.md` (la versión anterior tenía cifras de ROI que ya no están en la versión actual), y fechas/estados desactualizados.

---

## 📖 Documentos disponibles

### 🚀 Quick Start
**[QUICK-START-SECURITY.md](QUICK-START-SECURITY.md)**
Guía rápida para configurar las funcionalidades de seguridad.

**Para:** nuevos desarrolladores, setup rápido del entorno, comandos esenciales de seguridad.

---

### 📊 Executive Summary
**[EXECUTIVE-SUMMARY.md](EXECUTIVE-SUMMARY.md)**
Resumen ejecutivo del estado de seguridad para stakeholders no técnicos.

**Para:** product managers, stakeholders, decisiones de negocio.

**Incluye:** estado actual del security score (7/10), acciones pendientes priorizadas, roadmap de seguridad. No incluye cifras de ROI ni estimaciones de tiempo de implementación — fueron removidas en la revisión de 2026-06-30 por no estar verificadas.

---

### ✅ Security Checklist
**[SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md)**
Checklist de seguridad para desarrollo y deployment.

**Para:** developers antes de deploy, DevOps, QA, auditorías.

**Incluye:** pre-deploy checklist, hardening checklist, incident response checklist, compliance checklist, maintenance schedule.

---

### 🔐 Secret Rotation Guide
**[SECRET-ROTATION.md](SECRET-ROTATION.md)**
Guía para rotar los secrets comprometidos — **sin valores reales** (fueron redactados en la revisión de 2026-06-30).

**Para:** respuesta a incidentes, rotación programada, onboarding de nuevos servicios.

**Incluye:** pasos para rotar cada servicio (Resend, Twilio, CRON), checklist post-rotación, mejores prácticas, runbook de respuesta a incidentes, y un hallazgo crítico sobre `scripts/validate-env.js` que aún contiene los secrets en texto plano en código funcional (sin corregir — fuera del alcance de esta revisión documental).

---

### 🛠️ Security Implementation Details
**[SECURITY-IMPLEMENTATION.md](SECURITY-IMPLEMENTATION.md)**
Detalle técnico de las implementaciones de seguridad.

**Para:** developers, code reviews, documentación técnica, training de equipo.

**Incluye:** rate limiting, validación de inputs, security headers, pre-commit hooks, environment validation, security logging, middleware con gating por rol.

---

## 📁 Archivo en la raíz del proyecto

### 🔐 SECURITY-REPORT.md
**Ubicación:** `../SECURITY-REPORT.md`

Reporte completo de seguridad — la fuente autoritativa de scores. Incluye la sección de vulnerabilidades activas y el roadmap de seguridad por fases.

---

## 🗂️ Orden de lectura recomendado

### Para nuevos developers
1. [QUICK-START-SECURITY.md](QUICK-START-SECURITY.md)
2. [SECURITY-IMPLEMENTATION.md](SECURITY-IMPLEMENTATION.md)
3. [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md)
4. [SECRET-ROTATION.md](SECRET-ROTATION.md) — referencia cuando se necesite

### Para product/business
1. [EXECUTIVE-SUMMARY.md](EXECUTIVE-SUMMARY.md)
2. [../SECURITY-REPORT.md](../SECURITY-REPORT.md)

### Para DevOps/SRE
1. [SECRET-ROTATION.md](SECRET-ROTATION.md)
2. [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md)
3. [SECURITY-IMPLEMENTATION.md](SECURITY-IMPLEMENTATION.md)

### En caso de incidente
1. [SECRET-ROTATION.md](SECRET-ROTATION.md) — sección "Qué hacer si sospechás un compromiso"
2. [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) — sección "Incident Response Checklist"

---

## 🔗 Comandos rápidos

```bash
# Validar configuración
pnpm validate-env

# Verificar seguridad pre-commit
pnpm security-check

# Configurar git hooks
pnpm setup-hooks

# Checklist pre-deployment
pnpm predeploy
```

### Recursos externos
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Headers Checker](https://securityheaders.com)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)

### Dashboards de los proveedores
- [Resend Dashboard](https://resend.com/api-keys)
- [Twilio Console](https://console.twilio.com)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

## 📊 Estado actual (verificado 2026-06-30)

- **Security Score:** 7/10 (según `SECURITY-REPORT.md`, score de Authentication marcado como posiblemente desactualizado)
- **Vulnerabilidades críticas activas:** rotación de secrets vencida + secrets en texto plano en `scripts/validate-env.js` (código funcional, no corregido en esta revisión) + RLS sin verificar en runtime
- **Protecciones activas:** rate limiting, validación de inputs, security headers, pre-commit hooks, environment validation, security logging, middleware con gating por rol
- **Última auditoría documental:** 2026-06-30

---

## 🤝 Contribuir a la documentación

1. Crear issue describiendo la mejora
2. Hacer PR con los cambios
3. Marcar como "documentation"
4. Actualizar la fecha de "Última actualización" del documento modificado

### Guía de estilo
- Links relativos dentro del proyecto
- No incluir valores reales de secrets, ni siquiera truncados
- Si una afirmación no se puede verificar contra el código, marcarla explícitamente como no verificada

---

## 📞 Contacto

**Para consultas de seguridad:**
- Email: luisrissopa@gmail.com
- GitHub Issues: marcar como "security"
- Urgencias: seguir el proceso en `SECRET-ROTATION.md`

**Para reportar vulnerabilidades:**
- Email: luisrissopa@gmail.com
- Subject: `[SECURITY] Vulnerabilidad en Ornō`
- Incluir: descripción, pasos para reproducir, impacto estimado

---

**Última actualización:** 2026-06-30
**Próxima revisión recomendada:** al rotar los secrets y corregir `scripts/validate-env.js`
