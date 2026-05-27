# Delta for booking-crear-cita

## MODIFIED Requirements

### Requirement: Cliente reserva una cita exitosa

(Previously: el endpoint POST /api/appointments devolvía 501 en producción y sólo funcionaba en modo demo)

El sistema DEBE persistir la cita en la base de datos Supabase cuando el modo demo
no está activo y las credenciales de Supabase están configuradas.

El sistema DEBE validar el input con el schema Zod definido en `lib/validation.ts`
antes de ejecutar cualquier operación de escritura.

El sistema DEBE respetar las políticas RLS de Supabase — la cita se inserta usando
el cliente autenticado del usuario (no el cliente admin), para que las policies apliquen.

#### Scenario: Cliente reserva una cita exitosa (producción)

- GIVEN el entorno de producción con Supabase configurado
- AND el usuario está autenticado con rol `client`
- WHEN envía un POST a `/api/appointments` con `barber_id`, `service_id`, `appointment_date` y `appointment_time` válidos
- THEN la cita se inserta en la tabla `appointments` con `status = 'pending'`
- AND el sistema responde con `200 OK` y el objeto `appointment` creado
- AND se respetan las políticas RLS de la tabla

#### Scenario: Intento de reservar con datos inválidos

- GIVEN el entorno de producción
- WHEN el cliente envía un POST con campos faltantes o con formato incorrecto
- THEN el sistema responde con `400 Bad Request`
- AND el body incluye el campo `details` con los errores de validación por campo
- AND no se realiza ninguna escritura en la base de datos

#### Scenario: Fallo de escritura en Supabase

- GIVEN el entorno de producción
- WHEN la inserción en Supabase falla (ej. violación de constraint, RLS policy bloqueó)
- THEN el sistema responde con `500 Internal Server Error`
- AND no expone el mensaje de error interno de Supabase al cliente

#### Scenario: Modo demo activo

- GIVEN `isDemoMode()` retorna `true`
- WHEN el cliente envía un POST válido a `/api/appointments`
- THEN el sistema simula la creación y responde con `200 OK`
- AND el mensaje incluye `(modo demo)` para indicar que no hubo persistencia real
