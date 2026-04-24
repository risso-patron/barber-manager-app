# Especificación: Crear una nueva cita

## Escenario: Cliente reserva una cita exitosa

**Given** un cliente autenticado  
**When** completa el formulario de reserva con fecha, hora y servicio válidos  
**Then** la cita se crea en la base de datos  
**And** el cliente recibe una confirmación visual  
**And** el empleado asignado recibe una notificación

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
