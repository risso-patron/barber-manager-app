# 🔐 Guía de Rotación de Secrets

> Auditado y corregido el 2026-06-30. Actualizado el 2026-07-07 para reflejar rotación ejecutada.
>
> **La versión anterior de este documento contenía los valores reales de los secrets expuestos, en texto plano.** Esos valores fueron eliminados en la revisión del 30/06. Nunca deben volver a pegarse acá, ni siquiera parcialmente.

## ✅ Rotación EJECUTADA (actualizado 2026-07-07)

Los siguientes 3 secrets estaban expuestos en texto plano en commits anteriores de este repositorio y **fueron rotados ~2026-06-30**:

1. ✅ **Resend API Key** (`RESEND_API_KEY`) — rotada
2. ✅ **Twilio Auth Token** (`TWILIO_AUTH_TOKEN`) — rotado  
3. ✅ **CRON Secret** (`CRON_SECRET`) — regenerado

🟢 **Estado confirmado (2026-07-07):** los tres valores fueron regenerados en los dashboards de Resend/Twilio, actualizados en Vercel (producción) y en `.env.local` (laptop personal del usuario + esta máquina). `pnpm validate-env` confirma que los tres pasan validación en esta máquina. No verificable independientemente por el agente — acciones manuales externas a git, registradas según reporte del usuario.

> ✅ **Corrección:** una versión anterior de este doc afirmaba que `scripts/validate-env.js` tenía los 3 valores reales hardcodeados "hoy" (2026-06-30). Eso ya no es así — fue corregido en commit `1fa6145` (2026-06-30), mismo día, unas horas después de escribir esa advertencia. El archivo actual usa detección de patrones, sin valores reales (verificado leyendo el archivo 2026-07-07).

> ⚠️ **Historial de git:** rotar el valor en el dashboard no "borra" la exposición histórica. Los valores viejos quedan en commits previos a `1fa6145`. Purgar historial fue excluido del alcance (`openspec/changes/archive/2026-07-07-rotate-secrets/proposal.md`).

---

### 1. Resend API Key

**Pasos para rotar:**
```bash
# 1. Ir a Resend Dashboard
https://resend.com/api-keys

# 2. Eliminar la key expuesta (compararla manualmente contra el valor que tengas en tu .env.local actual)

# 3. Generar una nueva key
- "Create API Key" → nombre descriptivo (ej. "Orno - Production")
- Permisos: el mínimo necesario (Sending Access, no Full Access, salvo que se use la API de dominios)

# 4. Actualizar .env.local
RESEND_API_KEY=<la_nueva_key>

# 5. Actualizar también en el proveedor de hosting (Vercel u otro) si hay un deploy activo
```

---

### 2. Twilio Auth Token

**Pasos para rotar:**
```bash
# 1. Ir a Twilio Console → Settings → General
https://console.twilio.com

# 2. En "API Credentials", click en "Reset Auth Token" y confirmar

# 3. Actualizar .env.local
TWILIO_AUTH_TOKEN=<el_nuevo_token>

# 4. Actualizar también en el proveedor de hosting si aplica
```

---

### 3. CRON Secret

**Pasos para rotar:**
```bash
# 1. Generar un secret nuevo y aleatorio (no reutilizar el patrón anterior)
openssl rand -hex 32

# 2. Actualizar .env.local
CRON_SECRET=<el_output_del_comando_anterior>

# 3. Actualizar en el proveedor de hosting si aplica

# 4. Actualizar cualquier servicio externo que dispare los cron jobs (Vercel Cron, GitHub Actions, etc.)
```

---

## 📋 Checklist de seguridad post-rotación

### Paso 1: Local
- [ ] Nuevas keys en `.env.local`
- [ ] Confirmar que `.env.local` está en `.gitignore`
- [ ] `pnpm validate-env` sin errores
- [ ] Probar envío de email (Resend) y de WhatsApp (Twilio) en modo desarrollo

### Paso 2: Producción (si aplica)
- [ ] Actualizar `RESEND_API_KEY`, `TWILIO_AUTH_TOKEN` y `CRON_SECRET` en el proveedor de hosting
- [ ] Redeploy para aplicar los cambios

### Paso 3: Verificación
- [ ] Probar login en producción
- [ ] Probar creación de una cita
- [ ] Verificar que llega el email de confirmación
- [ ] Verificar que llega la notificación de WhatsApp
- [ ] Revisar logs por errores

### Paso 4: Limpieza
- [ ] Revocar/eliminar las keys viejas en los dashboards de Resend y Twilio
- [ ] Documentar la fecha real de rotación en este archivo
- [ ] Programar la próxima rotación (recomendado: cada 90 días)

---

## 🔒 Mejores prácticas

### 1. Nunca commitear secrets
```bash
git status
git diff --cached

# Si se agregó .env.local por error:
git reset HEAD .env.local
git rm --cached .env.local
```

### 2. Usar el template
```bash
cp .env.local.template .env.local
# Nunca commitear .env.local, solo .env.local.template
```

### 3. Rotar regularmente
- API keys de terceros: cada 90 días
- Secrets internos (CRON_SECRET, etc.): cada 180 días
- Después de que alguien con acceso al repo se va: inmediatamente

### 4. Monitoreo
- Alertas de uso inusual en Resend y Twilio
- Revisión periódica de logs por patrones sospechosos

### 5. Principio de mínimo privilegio
- Resend: permisos de "Sending" únicamente si no se necesita más
- Twilio: permisos de WhatsApp únicamente si no se usa SMS/Voice
- Supabase: `anon key` en cliente, `service_role key` **solo en servidor**, nunca expuesta al navegador

---

## 🚨 Qué hacer si sospechás un compromiso

### Señales
- Picos inesperados de uso en Resend/Twilio
- Emails o mensajes enviados que no reconocés
- Cambios en la base de datos que no hiciste
- Facturas más altas de lo normal

### Respuesta inmediata (primeros 15 minutos)
1. Rotar todos los secrets (ver arriba)
2. Revisar facturación de Resend y Twilio
3. Revisar logs de acceso a la base de datos
4. Desactivar servicios temporalmente si es necesario

### Investigación (primeras 2 horas)
1. Revisar commits recientes en git
2. Revisar access logs del proveedor de hosting
3. Revisar webhooks e integraciones activas
4. Contactar soporte de los servicios afectados

### Notificación (primeras 24 horas)
1. Notificar al equipo
2. Documentar el incidente
3. Si afecta a usuarios reales, evaluar notificarles
4. Revisar obligaciones legales aplicables (ej. protección de datos)

### Post-mortem (primera semana)
1. ¿Cómo se comprometieron los secrets?
2. ¿Qué impacto tuvo?
3. ¿Cómo prevenirlo en el futuro?
4. Implementar controles adicionales (ej. secret scanning automatizado en CI)

---

## 📞 Contactos de los proveedores

| Servicio | Dashboard | Soporte |
|---|---|---|
| Resend | https://resend.com | support@resend.com |
| Twilio | https://console.twilio.com | https://support.twilio.com |
| Supabase | https://supabase.com/dashboard | support@supabase.io |

---

## ✅ Verificación post-rotación

```bash
# Verificar que las variables están configuradas correctamente
pnpm validate-env
```

> Corrige una instrucción anterior: este documento mencionaba un comando `npm run test:integrations` que **no existe** en `package.json`. Los scripts reales disponibles para verificación son `pnpm validate-env`, `pnpm test`, `pnpm test:e2e` y `pnpm security-check` — ver la lista completa en el [README.md](../README.md#comandos-disponibles).

Una vez verificado, commitear el cambio de configuración (sin incluir nunca el valor del secret):
```bash
git add .
git commit -m "chore: rotar API keys por seguridad"
```

---

**Última rotación documentada:** ~2026-06-30 (Twilio Auth Token, Resend API Key, CRON Secret — confirmado 2026-07-07)  
**Próxima rotación programada:** 2026-09-28 (90 días desde la última, según mejores prácticas de este documento)
