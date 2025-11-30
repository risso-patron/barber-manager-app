# 🚀 Quick Start - Security Features

## En 5 Minutos

### 1. Configurar Environment (2 min)
```bash
# Copiar template
cp .env.local.template .env.local

# Editar con tus keys
# IMPORTANTE: NO uses las keys del template, son ejemplos

# Validar
npm run validate-env
```

### 2. Configurar Git Hooks (1 min)
```bash
npm run setup-hooks
```

### 3. Probar Seguridad (2 min)
```bash
# Intentar commit con .env.local (debería bloquearse)
git add .env.local
git commit -m "test"  # ❌ Bloqueado

# Validar headers
npm run dev
# Visitar: http://localhost:3000
# Abrir DevTools > Network > Ver headers
```

---

## Comandos Esenciales

```bash
# Antes de commitear
npm run security-check

# Antes de deploy
npm run validate-env
npm run predeploy

# Después de rotar secrets
npm run validate-env

# Configurar hooks (una vez)
npm run setup-hooks
```

---

## Rate Limiting Cheat Sheet

### Login Endpoint
- **Límite:** 5 intentos / 15 minutos
- **Reset:** Automático después de 15 min
- **Response:** HTTP 429 con `Retry-After` header

### Appointments Endpoint
- **Límite:** 10 reservas / minuto
- **Reset:** Cada minuto
- **Response:** HTTP 429 con tiempo de espera

### Aplicar en Nuevos Endpoints
```typescript
import { withRateLimit, apiLimiter } from '@/lib/rate-limit'

export async function POST(request: Request) {
  return withRateLimit(request, apiLimiter, async () => {
    // Tu código aquí
  })
}
```

---

## Validation Cheat Sheet

### Validar Inputs
```typescript
import { 
  validateEmail, 
  validatePassword,
  validatePhone,
  sanitizeInput 
} from '@/lib/validation'

// Email
const { valid, error } = validateEmail(email)
if (!valid) return { error }

// Password
const pwdCheck = validatePassword(password)
if (!pwdCheck.valid) return { errors: pwdCheck.errors }

// Sanitizar texto libre
const cleanText = sanitizeInput(userInput)
```

### Validar Citas Completas
```typescript
import { validateAppointmentInput } from '@/lib/validation'

const result = validateAppointmentInput(formData)
if (!result.valid) {
  return { errors: result.errors }
}
// result.data está validado y sanitizado
```

---

## Emergency Procedures

### Secret Comprometido
```bash
# 1. Rotar inmediatamente (ver docs/SECRET-ROTATION.md)

# 2. Validar nuevo secret
npm run validate-env

# 3. Actualizar en Vercel (si aplica)
vercel env pull

# 4. Redeploy
git push origin main
```

### Ataque Detectado
```bash
# 1. Revisar logs
vercel logs

# 2. Identificar IP atacante
# Ver X-Forwarded-For en logs

# 3. Rate limiter ya bloqueó automáticamente
# Esperar que se reset o banear IP en Vercel/Cloudflare

# 4. Notificar al equipo
# Usar plantilla en docs/SECRET-ROTATION.md
```

---

## Security Headers - Verificación Rápida

### Localmente
```bash
npm run dev

# En otra terminal
curl -I http://localhost:3000 | grep -E "(X-|Content-Security)"
```

### Producción
Visitar: https://securityheaders.com/?q=tudominio.com

Esperado: **A+** score

---

## Common Issues

### ❌ "Too many requests"
**Causa:** Rate limit alcanzado  
**Solución:** Esperar el tiempo en `Retry-After` header

### ❌ "Invalid environment variables"
**Causa:** `.env.local` mal configurado  
**Solución:** `npm run validate-env` para detalles

### ❌ "Commit blocked by security"
**Causa:** Intentando commitear secrets  
**Solución:** Remover archivo sensible del staging

### ❌ "Email validation failed"
**Causa:** Email no válido o SQL injection attempt  
**Solución:** Verificar formato de email

---

## Testing Security

### Test Rate Limiting
```bash
# Hacer múltiples requests rápidos
for i in {1..10}; do
  curl http://localhost:3000/api/auth/login \
    -X POST \
    -d '{"email":"test@test.com","password":"test"}' \
    -H "Content-Type: application/json"
done

# Debería bloquearse después de 5
```

### Test Input Validation
```bash
# XSS attempt (debería sanitizarse)
curl http://localhost:3000/api/appointments \
  -X POST \
  -d '{"clientName":"<script>alert(1)</script>"}' \
  -H "Content-Type: application/json"

# SQL injection attempt (debería rechazarse)
curl http://localhost:3000/api/auth/login \
  -X POST \
  -d '{"email":"admin@test.com OR 1=1--","password":"test"}' \
  -H "Content-Type: application/json"
```

### Test Security Headers
```bash
curl -I https://tudominio.com | grep X-Frame-Options
# Esperado: X-Frame-Options: SAMEORIGIN
```

---

## Files to NEVER Commit

```
.env.local
.env.production
.env.development.local
*.pem
*.key
secrets.json
credentials.json
```

**Protección activa:** Pre-commit hook bloquea automáticamente

---

## Security Score Tracking

| Fecha | Score | Cambios |
|-------|-------|---------|
| 28/11/2025 | 4/10 | Estado inicial |
| 29/11/2025 | 7/10 | Rate limiting, validation, headers |
| [Futuro] | 9/10 | Supabase Auth, RLS |

---

## Resources

### Documentación
- [SECURITY-REPORT.md](../SECURITY-REPORT.md) - Análisis completo
- [SECRET-ROTATION.md](SECRET-ROTATION.md) - Rotación de secrets
- [SECURITY-IMPLEMENTATION.md](SECURITY-IMPLEMENTATION.md) - Detalles técnicos
- [EXECUTIVE-SUMMARY.md](EXECUTIVE-SUMMARY.md) - Resumen ejecutivo

### External
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Headers](https://securityheaders.com)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)

---

**Última actualización:** 29/11/2025  
**Mantenido por:** Dev Team
