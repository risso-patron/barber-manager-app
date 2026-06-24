# 🔐 Guía de Rotación de Secrets

## 🚨 URGENTE: Secrets Expuestos

Los siguientes secrets fueron expuestos en el repositorio y **DEBEN** ser rotados inmediatamente:

### 1. Resend API Key
**Expuesta:** `re_jE4Rnrkv_KKPpYp2tpxYxVjymWTF2QT9w`

**Pasos para rotar:**
```bash
# 1. Ir a Resend Dashboard
https://resend.com/api-keys
 
# 2. Eliminar la key expuesta
- Buscar: re_jE4Rnrkv_KKPpYp2tpxYxVjymWTF2QT9w
- Click en "Delete"

# 3. Generar nueva key
- Click "Create API Key"
- Nombre: "Barber Manager - Production"
- Permisos: "Full Access" o "Sending Access"
- Copiar la nueva key

# 4. Actualizar .env.local
RESEND_API_KEY=re_NUEVA_KEY_AQUI

# 5. Si está en Vercel, actualizar también allí
```

---

### 2. Twilio Auth Token
**Expuesto:** `7050dd63b32c8d8ba3f97e6bf01b8e0b`

**Pasos para rotar:**
```bash
# 1. Ir a Twilio Console
https://console.twilio.com

# 2. En la vista del proyecto
- Click en "Settings" → "General"

# 3. Scroll a "API Credentials"
- Click en el ícono de "View" junto a Auth Token
- Click "Reset Auth Token"
- Confirmar la rotación

# 4. Copiar el nuevo token

# 5. Actualizar .env.local
TWILIO_AUTH_TOKEN=NUEVO_TOKEN_AQUI

# 6. Si está en Vercel, actualizar también
```

---

### 3. CRON Secret
**Expuesto:** `barber_cron_secret_2024`

**Pasos para rotar:**
```bash
# 1. Generar nuevo secret seguro
openssl rand -hex 32

# 2. Actualizar .env.local
CRON_SECRET=el_output_del_comando_anterior

# 3. Actualizar en Vercel si aplica

# 4. Actualizar cualquier servicio que llame a los cron jobs
# (e.g., Vercel Cron, GitHub Actions, etc.)
```

---

## 📋 Checklist de Seguridad Post-Rotación

### Paso 1: Actualizar Local
- [ ] Nuevas keys en `.env.local`
- [ ] Verificar que `.env.local` está en `.gitignore`
- [ ] Probar que la aplicación funciona con las nuevas keys
- [ ] Probar envío de emails (Resend)
- [ ] Probar envío de WhatsApp (Twilio)

### Paso 2: Actualizar Producción (si aplica)
- [ ] Ir a Vercel Dashboard → Proyecto → Settings → Environment Variables
- [ ] Actualizar `RESEND_API_KEY`
- [ ] Actualizar `TWILIO_AUTH_TOKEN`
- [ ] Actualizar `CRON_SECRET`
- [ ] Redeploy para aplicar cambios

### Paso 3: Verificación
- [ ] Probar login en producción
- [ ] Probar creación de cita
- [ ] Verificar que llega email de confirmación
- [ ] Verificar que llega WhatsApp de notificación
- [ ] Revisar logs por errores

### Paso 4: Limpieza
- [ ] Revocar/eliminar las keys viejas de los dashboards
- [ ] Documentar la fecha de rotación
- [ ] Programar próxima rotación (recomendado: cada 90 días)

---

## 🔒 Mejores Prácticas

### 1. Nunca Commitear Secrets
```bash
# Siempre verificar antes de commit
git status
git diff --cached

# Si accidentalmente agregaste .env.local:
git reset HEAD .env.local
git rm --cached .env.local
```

### 2. Usar el Template
```bash
# Copiar el template para nuevos desarrolladores
cp .env.local.template .env.local

# Nunca commitear .env.local, solo .env.local.template
```

### 3. Rotar Regularmente
- **API Keys de terceros:** Cada 90 días
- **Secrets internos:** Cada 180 días
- **Passwords de bases de datos:** Al menos anualmente
- **Después de que un empleado se va:** Inmediatamente

### 4. Monitoreo
- Configurar alertas en Resend para uso inusual
- Configurar alertas en Twilio para picos de uso
- Revisar logs semanalmente por patrones sospechosos

### 5. Principle of Least Privilege
- Resend: Solo permisos de "Sending" si no necesitas otros
- Twilio: Solo permisos de WhatsApp si no usas SMS/Voice
- Supabase: Usar `anon_key` en cliente, `service_role` solo en servidor

---

## 🚨 Qué Hacer Si Sospechas Compromiso

### Detección
Señales de que tus secrets pueden estar comprometidos:
- Picos inesperados en uso de Resend/Twilio
- Emails enviados que no reconoces
- Cambios en la base de datos que no hiciste
- Facturas más altas de lo normal

### Respuesta Inmediata (hacer en 15 minutos)
1. **Rotar todos los secrets** siguiendo las guías arriba
2. **Revisar facturas** de Resend y Twilio
3. **Revisar logs** de acceso a la base de datos
4. **Desactivar servicios** temporalmente si es necesario

### Investigación (primeras 2 horas)
1. Revisar commits recientes en Git
2. Revisar access logs de Vercel
3. Revisar webhooks y integraciones activas
4. Contactar soporte de los servicios afectados

### Notificación (primeras 24 horas)
1. Notificar al equipo
2. Documentar el incidente
3. Si afecta a usuarios, considerar notificarles
4. Revisar obligaciones legales (GDPR, etc.)

### Post-Mortem (primera semana)
1. ¿Cómo se comprometieron los secrets?
2. ¿Qué daño se hizo?
3. ¿Cómo prevenirlo en el futuro?
4. Implementar controles adicionales

---

## 📞 Contactos de Emergencia

### Resend
- Dashboard: https://resend.com
- Soporte: support@resend.com
- Documentación: https://resend.com/docs

### Twilio
- Console: https://console.twilio.com
- Soporte: https://support.twilio.com
- Emergency: Disable API key en console

### Supabase
- Dashboard: https://supabase.com/dashboard
- Soporte: support@supabase.io
- Docs: https://supabase.com/docs

---

## ✅ Verificación Post-Rotación

Ejecuta este script después de rotar:

```bash
# Verificar que las variables están configuradas
npm run validate-env

# Probar conexión a servicios
npm run test:integrations

# Si todo pasa, hacer commit
git add .
git commit -m "chore: Rotate API keys for security"
```

---

**Última actualización:** 29 de noviembre de 2025  
**Próxima rotación programada:** 27 de febrero de 2026
