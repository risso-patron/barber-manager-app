# 🚀 Quick Start - Seguridad

> Auditado y corregido el 2026-06-30. Esta revisión corrige los comandos (el proyecto usa `pnpm`, no `npm`, según `package.json`) y la tabla de score al final, que daba la autenticación con Supabase como trabajo futuro cuando ya está implementada en el código.

## En 5 minutos

### 1. Configurar environment (2 min)
```bash
# Copiar template
cp .env.local.template .env.local

# Editar con tus keys
# IMPORTANTE: NO uses las keys del template, son ejemplos

# Validar
pnpm validate-env
```

### 2. Configurar git hooks (1 min)
```bash
pnpm setup-hooks
```

### 3. Probar seguridad (2 min)
```bash
# Intentar commit con .env.local (debería bloquearse)
git add .env.local
git commit -m "test"  # ❌ Bloqueado

# Validar headers
pnpm dev
# Visitar: http://localhost:3000
# Abrir DevTools > Network > Ver headers
```

---

## Comandos esenciales

```bash
# Antes de commitear
pnpm security-check

# Antes de deploy
pnpm validate-env
pnpm predeploy

# Después de rotar secrets
pnpm validate-env

# Configurar hooks (una vez)
pnpm setup-hooks
```

---

## Rate limiting — referencia rápida

### Endpoint de login
- **Límite:** 5 intentos / 15 minutos
- **Reset:** Automático después de 15 min
- **Response:** HTTP 429 con header `Retry-After`

### Endpoint de citas
- **Límite:** 10 reservas / minuto
- **Reset:** Cada minuto
- **Response:** HTTP 429 con tiempo de espera

### Aplicar en endpoints nuevos
```typescript
import { withRateLimit, apiLimiter } from '@/lib/rate-limit'

export async function POST(request: Request) {
  return withRateLimit(request, apiLimiter, async () => {
    // Tu código aquí
  })
}
```

---

## Validación — referencia rápida

### Validar inputs
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

### Validar citas completas
```typescript
import { validateAppointmentInput } from '@/lib/validation'

const result = validateAppointmentInput(formData)
if (!result.valid) {
  return { errors: result.errors }
}
// result.data está validado y sanitizado
```

---

## Procedimientos de emergencia

### Secret comprometido
```bash
# 1. Rotar inmediatamente (ver docs/SECRET-ROTATION.md)

# 2. Validar nuevo secret
pnpm validate-env

# 3. Actualizar en el proveedor de hosting (si aplica)

# 4. Redeploy
git push origin main
```

### Ataque detectado
```bash
# 1. Revisar logs del proveedor de hosting

# 2. Identificar IP atacante
# Ver X-Forwarded-For en logs

# 3. El rate limiter ya bloqueó automáticamente
# Esperar el reset o banear la IP en el proveedor de hosting/CDN

# 4. Notificar al equipo
# Seguir el runbook de "Qué hacer si sospechás un compromiso" en docs/SECRET-ROTATION.md
```

---

## Security headers — verificación rápida

### Localmente
```bash
pnpm dev

# En otra terminal
curl -I http://localhost:3000
# Revisar manualmente los headers X-* y Content-Security-Policy en la respuesta
```

### Producción
Visitar: https://securityheaders.com/?q=tudominio.com

Esperado: score **A** o superior (no verificado de forma independiente en esta auditoría — pendiente correr contra un deploy real).

---

## Problemas comunes

### ❌ "Too many requests"
**Causa:** rate limit alcanzado
**Solución:** esperar el tiempo indicado en el header `Retry-After`

### ❌ "Invalid environment variables"
**Causa:** `.env.local` mal configurado
**Solución:** `pnpm validate-env` para ver el detalle

### ❌ "Commit blocked by security"
**Causa:** se intentó commitear un archivo sensible
**Solución:** sacarlo del staging (`git restore --staged <archivo>`)

### ❌ "Email validation failed"
**Causa:** email con formato inválido o intento de SQL injection
**Solución:** verificar el formato del email

---

## Probar la seguridad manualmente

### Rate limiting
```bash
# Hacer múltiples requests rápidos
for i in {1..10}; do
  curl http://localhost:3000/api/auth/login \
    -X POST \
    -d '{"email":"test@test.com","password":"test"}' \
    -H "Content-Type: application/json"
done

# Debería bloquearse después del 5to intento
```

### Validación de inputs
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

> Estos comandos son ejemplos de prueba manual local, no un test automatizado del repositorio — no existe un script `pnpm test:integrations` ni equivalente para esto (ver nota en `docs/SECRET-ROTATION.md`).

---

## Archivos que NUNCA hay que commitear

```
.env.local
.env.production
.env.development.local
*.pem
*.key
secrets.json
credentials.json
```

**Protección activa:** el pre-commit hook (`scripts/pre-commit-security.js`) bloquea estos patrones automáticamente, una vez corrido `pnpm setup-hooks`.

---

## Evolución del score de seguridad

| Fecha | Score | Cambios |
|-------|-------|---------|
| 28/11/2025 | 4/10 | Estado inicial |
| 29/11/2025 | 7/10 | Rate limiting, validación, headers |
| 2026-06-30 (esta auditoría) | 7/10 (sin cambios respecto a nov-2025, según `SECURITY-REPORT.md`) | Modo dual demo/Supabase ya está en el código, pero la rotación de secrets sigue pendiente y vencida — ver `docs/EXECUTIVE-SUMMARY.md` |

> Corrige una afirmación anterior: esta tabla daba "Supabase Auth, RLS" como mejora futura con score proyectado 9/10. El código de autenticación con Supabase **ya existe**, pero no se verificó en runtime contra una instancia real, y los secrets siguen sin rotar — por eso el score no sube todavía. No inventamos un score nuevo acá.

---

## Recursos

### Documentación interna
- [SECURITY-REPORT.md](../SECURITY-REPORT.md) — análisis completo (fuente autoritativa de scores)
- [SECRET-ROTATION.md](SECRET-ROTATION.md) — rotación de secrets
- [SECURITY-IMPLEMENTATION.md](SECURITY-IMPLEMENTATION.md) — detalles técnicos
- [EXECUTIVE-SUMMARY.md](EXECUTIVE-SUMMARY.md) — resumen ejecutivo

### Externos
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Headers](https://securityheaders.com)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)

---

**Última revisión:** 2026-06-30
