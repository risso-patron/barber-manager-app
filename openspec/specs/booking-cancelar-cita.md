# Especificación: Cancelar una cita

## Escenario: Cliente cancela una cita futura

**Given** un cliente autenticado con una cita pendiente  
**When** accede al historial y selecciona "Cancelar" en una cita futura  
**Then** la cita cambia su estado a "cancelada" en la base de datos  
**And** el cliente recibe una confirmación visual  
**And** el empleado asignado recibe una notificación de cancelación

## Escenario: Intento de cancelar una cita pasada

**Given** un cliente autenticado con una cita ya completada  
**When** intenta cancelar la cita  
**Then** el sistema muestra un mensaje de error  
**And** no cambia el estado de la cita

## Escenario: Cancelación por parte del administrador

**Given** un administrador autenticado  
**When** cancela una cita de cualquier cliente  
**Then** la cita cambia su estado a "cancelada"  
**And** tanto el cliente como el empleado reciben notificación
