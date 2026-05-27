# Delta for empleados-gestion

## ADDED Requirements

### Requirement: El sistema falla explícitamente si la service role key no está configurada

El sistema DEBE lanzar un error descriptivo cuando un endpoint que requiere acceso admin
a Supabase sea invocado sin que `SUPABASE_SERVICE_ROLE_KEY` esté definida en el entorno.

El error DEBE indicar exactamente qué variable de entorno falta para facilitar el diagnóstico.

El sistema NO DEBE crashear silenciosamente a nivel de módulo al inicializar el cliente admin.
La validación DEBE ocurrir en el momento de uso (lazy initialization).

#### Scenario: Alta de empleado con service role key ausente

- GIVEN el entorno no tiene `SUPABASE_SERVICE_ROLE_KEY` configurada
- WHEN un admin intenta crear un nuevo empleado via `POST /api/employees`
- THEN el sistema responde con `500 Internal Server Error`
- AND el mensaje de error indica: `Missing SUPABASE_SERVICE_ROLE_KEY environment variable`
- AND el error es registrado en los logs del servidor
- AND el resto de la aplicación sigue funcionando (sin crash a nivel de módulo)

#### Scenario: Alta de empleado con credenciales completas

- GIVEN el entorno tiene `SUPABASE_SERVICE_ROLE_KEY` configurada
- AND el usuario autenticado tiene rol `admin`
- WHEN envía un POST a `/api/employees` con nombre, email, teléfono y rol válidos
- THEN el sistema crea el usuario en Supabase Auth y el perfil en `public.users`
- AND responde con el perfil creado y la contraseña temporal generada
- AND si la inserción del perfil falla, hace rollback eliminando el usuario de Auth
