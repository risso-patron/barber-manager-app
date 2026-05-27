# Especificación: Crear una nueva cita

## Escenario: Cliente reserva una cita exitosa

**Given** un cliente autenticado con Supabase configurado  
**When** envía un POST a `/api/appointments` con `barber_id`, `service_id`, `appointment_date` y `appointment_time` válidos  
**Then** la cita se inserta en la tabla `appointments` con `status = 'pending'`  
**And** el sistema responde con `200 OK` y el objeto `appointment` creado  
**And** se respetan las políticas RLS de la tabla  
**And** el cliente recibe una confirmación visual

## Escenario: Intento de reservar con datos inválidos

**Given** el entorno de producción  
**When** el cliente envía un POST con campos faltantes o con formato incorrecto  
**Then** el sistema responde con `400 Bad Request`  
**And** el body incluye el campo `details` con los errores de validación por campo  
**And** no se realiza ninguna escritura en la base de datos

## Escenario: Fallo de escritura en Supabase

**Given** el entorno de producción  
**When** la inserción en Supabase falla (ej. violación de constraint, RLS policy bloqueó)  
**Then** el sistema responde con `500 Internal Server Error`  
**And** no expone el mensaje de error interno de Supabase al cliente

## Escenario: Modo demo activo

**Given** `isDemoMode()` retorna `true`  
**When** el cliente envía un POST válido a `/api/appointments`  
**Then** el sistema simula la creación y responde con `200 OK`  
**And** el mensaje incluye `(modo demo)` para indicar que no hubo persistencia real

## Escenario: Intento de reservar en horario no disponible

**Given** un cliente autenticado  
**When** intenta reservar en un horario ya ocupado  
**Then** el sistema muestra un mensaje de error  
**And** no se crea la cita

## Escenario: Validación de campos obligatorios

**Given** un cliente autenticado  
**When** deja campos obligatorios vacíos  
**Then** el sistema muestra mensajes de validación  
**And** no se crea la cita
