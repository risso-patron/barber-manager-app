# Configuración de Emails con Resend

## Paso 1: Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita (3,000 emails/mes gratis)
3. Verifica tu email

## Paso 2: Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre (ej: "barber-manager-app")
4. Copia la API key (empieza con `re_`)

## Paso 3: Configurar variables de entorno

Abre el archivo `.env.local` y reemplaza:

```bash
RESEND_API_KEY=tu_api_key_aqui
```

## Paso 4: Configurar dominio (Opcional - Producción)

Por defecto, Resend permite enviar desde `onboarding@resend.dev` para testing.

Para producción:
1. Ve a **Domains** en Resend
2. Agrega tu dominio
3. Configura los registros DNS según las instrucciones
4. Actualiza `.env.local`:
   ```bash
   RESEND_FROM_EMAIL=noreply@tudominio.com
   ```

## Testing

Para probar los emails sin configurar Resend:
- Los emails se enviarán a `onboarding@resend.dev` (solo testing)
- Verifica los logs en la consola del servidor
- Los emails aparecerán en el dashboard de Resend

## Emails implementados

✅ **Confirmación de cita**: Se envía cuando se crea una cita
✅ **Cambio de estado**: confirmed, cancelled, completed
✅ **Templates con diseño profesional**

## Próximos pasos

- [ ] Implementar recordatorios automáticos (24h antes)
- [ ] Email al barbero cuando se asigna una cita
- [ ] Template de feedback después del servicio
