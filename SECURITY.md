# 🔒 Guía de Seguridad - Barber Manager

## ⚠️ ADVERTENCIAS IMPORTANTES

### NO usar en producción hasta completar:

1. ✅ **Configuración de Supabase completada**
2. ✅ **Variables de entorno configuradas**
3. ✅ **Eliminación de código demo/testing**
4. ✅ **Actualización de dependencias**
5. ✅ **Auditoría de seguridad completada**

---

## 🚨 Problemas de Seguridad Conocidos

### CRÍTICO - Sistema Demo con localStorage (DEPRECADO)

**Estado:** ⚠️ EN PROCESO DE MIGRACIÓN

El sistema actualmente tiene dos modos de autenticación:
- **Modo Demo:** Usa localStorage (INSEGURO - solo para desarrollo)
- **Modo Producción:** Usa Supabase Auth (SEGURO)

**ACCIÓN REQUERIDA:**
- [ ] Eliminar completamente `lib/demo-auth.ts` antes de producción
- [ ] Eliminar referencias a localStorage en páginas
- [ ] Usar exclusivamente Supabase Auth
- [ ] Eliminar usuarios demo hardcodeados

**Archivos afectados:**
- `lib/demo-auth.ts` - ELIMINAR
- `lib/demo-data.ts` - ELIMINAR
- `components/demo/demo-users.tsx` - ELIMINAR
- Todas las referencias a `localStorage.getItem("currentUser")`

---

## ✅ Mejoras de Seguridad Implementadas

### 1. Validación de Variables de Entorno
- ✅ Schema de validación con Zod en `lib/env.ts`
- ✅ Detección de modo demo
- ✅ Errores claros si faltan variables

### 2. Schemas de Validación
- ✅ Validación de inputs con Zod en `lib/schemas.ts`
- ✅ Sanitización automática de datos
- ✅ Validación de tipos TypeScript

### 3. Manejo de Errores
- ✅ Clases de error personalizadas en `lib/errors.ts`
- ✅ Logging estructurado
- ✅ Mensajes seguros en producción

### 4. Middleware Mejorado
- ✅ Protección de rutas por rol
- ✅ Redirecciones seguras
- ✅ Verificación de sesión Supabase

### 5. TypeScript Estricto
- ✅ `forceConsistentCasingInFileNames: true`
- ✅ `noUncheckedIndexedAccess: true`
- ✅ `strictNullChecks: true`

---

## 🔐 Checklist de Seguridad para Producción

### Autenticación y Autorización
- [ ] Eliminar sistema demo completo
- [ ] Verificar RLS policies en Supabase
- [ ] Implementar rate limiting en login
- [ ] Configurar MFA (opcional pero recomendado)
- [ ] Verificar expiración de tokens
- [ ] Implementar refresh token rotation

### Datos Sensibles
- [ ] Nunca usar localStorage para tokens
- [ ] Usar cookies HTTPOnly
- [ ] Implementar CSRF protection
- [ ] Cifrar datos sensibles en BD
- [ ] No exponer IDs internos en URLs

### Variables de Entorno
- [ ] Verificar que `.env.local` no está en git
- [ ] Rotar todos los secrets antes de producción
- [ ] Usar diferentes keys para dev/staging/prod
- [ ] Configurar variables en Vercel/hosting
- [ ] Validar env vars al inicio de la app

### Código
- [ ] Ejecutar `npm audit fix`
- [ ] Actualizar todas las dependencias
- [ ] Eliminar console.log en producción
- [ ] Sanitizar todos los inputs de usuario
- [ ] Validar uploads de archivos
- [ ] Implementar Content Security Policy

### Base de Datos
- [ ] Habilitar RLS en todas las tablas
- [ ] Revisar policies de Supabase
- [ ] No usar service role key en cliente
- [ ] Backup automático configurado
- [ ] Encripción en reposo habilitada

### Red y Comunicación
- [ ] HTTPS only
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad (helmet)
- [ ] Rate limiting en API routes
- [ ] Validación de origen de requests

---

## 🛡️ Mejores Prácticas

### 1. Autenticación con Supabase

```typescript
// ✅ CORRECTO - Usar Supabase Auth
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()

// ❌ INCORRECTO - No usar localStorage
localStorage.setItem('token', token)
```

### 2. Validación de Inputs

```typescript
// ✅ CORRECTO - Validar con schemas
import { loginSchema } from '@/lib/schemas'

const result = loginSchema.safeParse(formData)
if (!result.success) {
  // Manejar errores de validación
}

// ❌ INCORRECTO - Confiar en el input
const { email, password } = formData // Sin validación
```

### 3. Manejo de Errores

```typescript
// ✅ CORRECTO - Errores específicos
import { AuthError, getErrorMessage } from '@/lib/errors'

try {
  // operación
} catch (error) {
  const message = getErrorMessage(error)
  // Mostrar mensaje seguro
}

// ❌ INCORRECTO - Exponer detalles internos
catch (error) {
  alert(error.message) // Puede contener info sensible
}
```

### 4. Protección de Rutas

```typescript
// ✅ CORRECTO - Usar hook personalizado
import { useRequireAuth } from '@/hooks/useRequireAuth'

function AdminPage() {
  const user = useRequireAuth(['admin'])
  if (!user) return <Loading />
  return <AdminDashboard />
}

// ❌ INCORRECTO - Verificación manual inconsistente
function AdminPage() {
  const user = localStorage.getItem('user')
  if (!user) router.push('/login')
}
```

---

## 📞 Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** abras un issue público
2. Envía un email a: [tu-email-de-seguridad]
3. Incluye:
   - Descripción de la vulnerabilidad
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de corrección (opcional)

---

## 🔄 Actualizaciones de Seguridad

### Versión Actual: v0.1.0 (Development)

**Cambios recientes:**
- ✅ Validación de variables de entorno
- ✅ Schemas de validación con Zod
- ✅ Manejo de errores centralizado
- ✅ TypeScript config mejorado
- ⚠️ Sistema demo marcado como deprecado

**Próximos cambios:**
- [ ] Migración completa a Supabase Auth
- [ ] Eliminación de código demo
- [ ] Implementación de rate limiting
- [ ] Tests de seguridad automatizados

---

## 📚 Recursos

- [Supabase Auth Best Practices](https://supabase.com/docs/guides/auth)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)

---

**Última actualización:** 25 de noviembre de 2025
**Próxima revisión:** Antes de producción
