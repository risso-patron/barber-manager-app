# 🔐 Guía de Rotación de Secrets

> Auditado y corregido el 2026-06-30. **La versión anterior de este documento contenía los valores reales de los secrets expuestos, en texto plano.** Esos valores fueron eliminados en esta revisión — nunca deben volver a pegarse acá, ni siquiera parcialmente. Si necesitás confirmar si un valor coincide con el expuesto, comparalo manualmente desde el dashboard del proveedor, no lo escribas en ningún archivo versionado.

## 🚨 URGENTE: Secrets expuestos — rotación vencida

Los siguientes 3 secrets fueron expuestos en texto plano en este repositorio (en commits anteriores de este mismo archivo y de `docs/EXECUTIVE-SUMMARY.md`) y **deben rotarse de inmediato**:

1. **Resend API Key** (`RESEND_API_KEY`)
2. **Twilio Auth Token** (`TWILIO_AUTH_TOKEN`)
3. **CRON Secret** (`CRON_SECRET`)

🔴 **Estado real:** la rotación programada para el 27 de febrero de 2026 **no se ejecutó** — a la fecha de esta auditoría (30 de junio de 2026) lleva más de 4 meses de atraso. Mientras no se rote, estos 3 secrets deben considerarse comprometidos.

> 🔴🔴 **Hallazgo crítico de esta auditoría — exposición ACTIVA, no solo histórica:** `scripts/validate-env.js` (líneas 145-149) tiene los tres valores reales de estos secrets **hardcodeados en texto plano**, en un archivo de código trackeado por git y vigente en el commit `9aaf6dd` (2026-06-23). Esto significa que la exposición **no es solo del historial de git** — está en el árbol de trabajo actual. Esta auditoría es exclusivamente de documentación y no modifica código funcional, por lo que **este archivo no fue corregido acá**. Recomendación clara para el equipo de desarrollo: reemplazar la comparación de valores en texto plano por un hash (ej. SHA-256) de cada secret expuesto, de forma que el script pueda seguir detectando si alguien reutiliza el valor filtrado sin tener que guardar ese valor en texto plano en el repositorio. Este cambio debe tratarse como código funcional y hacerse en una tarea aparte, no como parte de esta revisión documental.

> ⚠️ **Importante:** rotar el valor en el dashboard del proveedor no "borra" la exposición. El valor anterior queda igual en el historial de git de este repositorio. Si el repositorio es o fue público, o tuvo colaboradores externos, los valores viejos deben tratarse como filtrados permanentemente — la única mitigación real es invalidarlos en el proveedor.

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

**Última rotación documentada:** 29 de noviembre de 2025 (la única registrada hasta la fecha)
**Próxima rotación programada:** vencida desde el 27 de febrero de 2026 — **pendiente de ejecutar**
