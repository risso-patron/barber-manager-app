# ✅ Security Checklist - Barber Manager

## 🎯 Pre-Deploy Checklist

### Fase 1: Configuración Básica
- [ ] **Environment Variables**
  - [ ] Copiar `.env.local.template` a `.env.local`
  - [ ] Reemplazar todos los placeholders (`tu_`, `NUEVA_`, `NUEVO_`)
  - [ ] Ejecutar `npm run validate-env` sin errores
  - [ ] Verificar que `.env.local` está en `.gitignore`
  - [ ] Confirmar que `.env.local` NO está tracked en Git

- [ ] **Git Security Hooks**
  - [ ] Ejecutar `npm run setup-hooks`
  - [ ] Probar con commit de prueba
  - [ ] Verificar que bloquea `.env.local` si se intenta commitear

- [ ] **Secrets Rotation (CRÍTICO)**
  - [ ] Rotar Resend API key (docs/SECRET-ROTATION.md)
  - [ ] Rotar Twilio Auth Token
  - [ ] Generar nuevo CRON_SECRET
  - [ ] Actualizar `.env.local` con nuevas keys
  - [ ] Verificar con `npm run validate-env`

### Fase 2: Testing Local
- [ ] **Build & Type Checking**
  - [ ] `npm run type-check` pasa sin errores
  - [ ] `npm run lint` pasa sin errores
  - [ ] `npm run build` completa exitosamente

- [ ] **Security Features**
  - [ ] Rate limiting funciona en login (5 intentos)
  - [ ] Validación rechaza emails inválidos
  - [ ] Validación rechaza passwords débiles
  - [ ] SQL injection attempts son bloqueados
  - [ ] XSS attempts son sanitizados

- [ ] **Logging**
  - [ ] Login exitoso genera log
  - [ ] Login fallido genera log
  - [ ] Rate limit exceeded genera log
  - [ ] SQL injection attempt genera alerta

### Fase 3: Vercel Configuration
- [ ] **Environment Variables en Vercel**
  - [ ] Ir a Vercel Dashboard → Settings → Environment Variables
  - [ ] Agregar todas las variables de `.env.local`
  - [ ] Marcar como "Production" y "Preview"
  - [ ] NO agregar secrets de desarrollo

- [ ] **Deployment Settings**
  - [ ] Framework preset: Next.js
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `.next`
  - [ ] Install command: `npm install`
  - [ ] Node version: 18.x o superior

- [ ] **Security Headers**
  - [ ] Verificar que `vercel.json` está commiteado
  - [ ] Headers configurados correctamente

### Fase 4: Post-Deploy Verification
- [ ] **Functional Testing**
  - [ ] Sitio carga correctamente
  - [ ] Login funciona
  - [ ] Reservas funcionan
  - [ ] Emails se envían (Resend)
  - [ ] WhatsApp se envía (Twilio)

- [ ] **Security Testing**
  - [ ] Probar rate limiting en producción
  - [ ] Verificar headers: https://securityheaders.com
  - [ ] Probar validación de formularios
  - [ ] Intentar acceso no autorizado
  - [ ] Verificar que middleware protege rutas (cuando se habilite)

- [ ] **Monitoring Setup**
  - [ ] Configurar alertas en Vercel
  - [ ] Configurar alertas en Resend
  - [ ] Configurar alertas en Twilio
  - [ ] Verificar logs en Vercel

---

## 🔐 Security Hardening Checklist

### Authentication & Authorization
- [x] Rate limiting en login (5 / 15min) ✅
- [x] Password validation (8+ chars, upper, lower, number) ✅
- [ ] Supabase Auth implementado ⏳ Fase 2
- [ ] Email verification requerido ⏳ Fase 2
- [ ] Session timeout (30 min) ⏳ Fase 2
- [ ] Row Level Security (RLS) en Supabase ⏳ Fase 2
- [ ] 2FA opcional ⏳ Fase 3

### Input Validation & Sanitization
- [x] Email validation ✅
- [x] Phone validation ✅
- [x] Name validation ✅
- [x] HTML sanitization (XSS prevention) ✅
- [x] SQL injection detection ✅
- [x] Date/time validation ✅
- [x] UUID validation ✅

### Rate Limiting & Abuse Prevention
- [x] Login endpoint (5/15min) ✅
- [x] Appointments endpoint (10/min) ✅
- [x] General API (60/min) ✅
- [ ] Redis/Upstash for production ⏳ Fase 3
- [ ] IP blocking for repeated abuse ⏳ Fase 3

### Security Headers
- [x] Content-Security-Policy ✅
- [x] Strict-Transport-Security ✅
- [x] X-Frame-Options ✅
- [x] X-Content-Type-Options ✅
- [x] X-XSS-Protection ✅
- [x] Referrer-Policy ✅
- [x] Permissions-Policy ✅

### Secrets Management
- [x] `.env.local` en `.gitignore` ✅
- [x] Pre-commit hook para bloquear secrets ✅
- [x] Validation script para detect exposed secrets ✅
- [x] Template `.env.local.template` ✅
- [ ] Secrets rotados y no expuestos ⏳ MANUAL
- [ ] Secrets Manager (AWS/Vercel) ⏳ Fase 3

### Logging & Monitoring
- [x] Security logger implementado ✅
- [x] Login events logging ✅
- [x] Rate limit events logging ✅
- [x] SQL injection attempts logging ✅
- [ ] Integration con Axiom/Datadog ⏳ Fase 3
- [ ] Alertas a Slack/Discord ⏳ Fase 3
- [ ] Dashboard de seguridad ⏳ Fase 3

### Error Handling
- [x] No revelar stack traces en producción ✅
- [x] Generic error messages para usuarios ✅
- [x] Detailed errors en logs ✅
- [x] Custom error pages (404, 500) ✅

### HTTPS & Network Security
- [x] Force HTTPS (HSTS) ✅
- [ ] Subdomain preloading ⏳ Después de 6 meses en HSTS
- [ ] Custom domain con SSL ⏳ Pre-producción
- [ ] WAF (Cloudflare/Vercel) ⏳ Fase 3

### Data Protection
- [ ] CORS configurado correctamente ⏳ Fase 2
- [ ] Supabase RLS policies ⏳ Fase 2
- [ ] Backup strategy ⏳ Fase 3
- [ ] Data encryption at rest ⏳ Fase 3
- [ ] GDPR compliance ⏳ Pre-producción

---

## 🚨 Incident Response Checklist

### Detección
- [ ] Revisar métricas de Vercel
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
- [ ] Probar fixes

### Comunicación
- [ ] Notificar al equipo
- [ ] Notificar a stakeholders
- [ ] Notificar a usuarios (si aplica)
- [ ] Cumplir obligaciones legales (GDPR, etc.)

### Post-Mortem
- [ ] Documentar incidente
- [ ] Identificar root cause
- [ ] Implementar mejoras
- [ ] Actualizar runbooks

---

## 📊 Compliance Checklist

### GDPR (si aplica en EU)
- [ ] Privacy policy publicada
- [ ] Terms of service publicados
- [ ] Cookie consent banner
- [ ] User data export capability
- [ ] User data deletion capability
- [ ] Data breach notification process
- [ ] DPO (Data Protection Officer) designado

### Accessibility (WCAG 2.1)
- [ ] Color contrast sufficient
- [ ] Keyboard navigation
- [ ] Screen reader compatible
- [ ] Alt text para imágenes
- [ ] Form labels correctos

### Performance
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passed
- [ ] Images optimizadas
- [ ] Bundle size < 200KB (first load)

---

## 📅 Maintenance Schedule

### Diario
- [ ] Revisar logs de errores
- [ ] Verificar uptime (99.9%+)
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
- [ ] Rotar secrets críticos
- [ ] Security audit completo
- [ ] Penetration testing
- [ ] Revisar y actualizar documentación

### Anual
- [ ] Renovar certificados SSL (auto en Vercel)
- [ ] Compliance audit
- [ ] Disaster recovery drill
- [ ] Team security training

---

## 🎓 Team Training Checklist

### Developers
- [ ] Leer SECURITY-REPORT.md
- [ ] Configurar git hooks (`npm run setup-hooks`)
- [ ] Entender rate limiting implementation
- [ ] Practicar con validation functions
- [ ] Conocer security logger

### DevOps
- [ ] Proceso de rotación de secrets
- [ ] Monitoring y alertas configuradas
- [ ] Incident response runbook
- [ ] Backup y recovery procedures

### QA
- [ ] Security testing checklist
- [ ] Tools para testing (Burp Suite, OWASP ZAP)
- [ ] Casos de prueba de seguridad
- [ ] Reporte de vulnerabilidades

---

**Última actualización:** 29 de noviembre de 2025  
**Próxima revisión:** Al habilitar Supabase Auth  
**Mantenido por:** Dev Team

---

## Quick Reference

```bash
# Antes de empezar
npm run setup-hooks

# Antes de commitear
npm run security-check

# Antes de deploy
npm run validate-env
npm run type-check
npm run build

# Después de rotar secrets
npm run validate-env

# Verificar producción
curl -I https://tudominio.com | grep X-Frame
```

**Score Actual:** 7/10 ✅  
**Score Objetivo:** 9/10 (con Fase 2)  
**Score Ideal:** 10/10 (con Fase 3)
