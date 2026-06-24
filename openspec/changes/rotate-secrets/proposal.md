# Propuesta de Cambio: `rotate-secrets`

## Intent (Intención)

El objetivo de este cambio es remediar la vulnerabilidad de secrets expuestos en el repositorio, la cual fue identificada como crítica en `SECURITY-REPORT.md`. La rotación de los secrets `TWILIO_AUTH_TOKEN`, `RESEND_API_KEY` y `CRON_SECRET` es un requisito indispensable para cumplir con los estándares de seguridad de la Fase 0 del plan de lanzamiento y proteger las integraciones con servicios de terceros.

## Scope (Alcance)

### In-Scope (Dentro del Alcance)

*   **Rotación de Secrets:** Generar nuevos valores para los tres secrets identificados:
    *   `TWILIO_AUTH_TOKEN`
    *   `RESEND_API_KEY`
    *   `CRON_SECRET`
*   **Actualización de Entornos:** Actualizar las variables de entorno con los nuevos valores en el dashboard de Vercel para el entorno de producción.
*   **Actualización de Plantillas:** Modificar los archivos de plantilla de entorno (p. ej., `.env.example`) para reemplazar los valores reales por placeholders genéricos (p. ej., `your_twilio_auth_token_here`).
*   **Limpieza de Documentación:** Eliminar los valores de los secrets en texto plano del archivo `SECURITY-REPORT.md` y reemplazarlos con una referencia a que fueron rotados.

### Out-of-Scope (Fuera del Alcance)

*   **Purgar Historial de Git:** No se purgará el historial de Git para eliminar las trazas de los secrets expuestos en commits anteriores. Esta tarea se registrará como un seguimiento técnico de alta prioridad, pero se excluye de este `change` para limitar la complejidad y el riesgo de corromper el repositorio.
*   **Implementar Gestor de Secrets Centralizado:** No se implementará una solución como HashiCorp Vault, Doppler o AWS Secrets Manager. La gestión de secrets seguirá dependiendo de las variables de entorno de Vercel por ahora.

## Approach (Enfoque)

El plan de acción se basará estrictamente en el procedimiento ya documentado y validado en `docs/SECRET-ROTATION.md`. El proceso se dividirá en tres fases claras para minimizar el riesgo y asegurar una transición sin interrupciones.

1.  **Fase 1: Generación de Nuevos Secrets**
    *   Se generarán nuevas claves para Twilio y Resend desde sus respectivos dashboards de administración.
    *   Se generará un nuevo `CRON_SECRET` utilizando el comando `openssl rand -hex 32` recomendado en la documentación.

2.  **Fase 2: Actualización de Entornos**
    *   Los nuevos secrets se actualizarán en el proyecto de Vercel, activando un nuevo despliegue de producción.
    *   Se actualizará el archivo `.env.local` para el desarrollo local.
    *   Se limpiarán los archivos `.env.example` y `SECURITY-REPORT.md`.

3.  **Fase 3: Validación**
    *   Se ejecutará la suite completa de tests E2E (`booking.e2e.spec.ts`, `login.e2e.spec.ts`) contra el entorno de producción para verificar que las funcionalidades dependientes de los secrets (envío de emails, SMS, tareas cron) siguen operativas.
    *   Se realizará una verificación manual en la aplicación desplegada para confirmar que el flujo de creación de citas y notificaciones funciona correctamente.

Este enfoque garantiza que seguimos un procedimiento probado, minimizando el tiempo de inactividad y validando la correcta implementación de la rotación antes de dar por concluida la tarea.
