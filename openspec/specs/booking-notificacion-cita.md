# Especificación: Notificación de cita

## Escenario: Notificar a empleado tras nueva cita

- Cuando se crea una cita, el empleado asignado debe recibir una notificación inmediata.
- La notificación debe incluir: nombre del cliente, fecha, hora y servicio.
- Si el empleado no tiene canal de notificación configurado, registrar el intento fallido en logs.

## Escenario: Notificar a cliente tras confirmación

- Al confirmarse la cita, el cliente debe recibir una notificación con los detalles.
- Si la cita es modificada, la notificación debe reflejar los cambios exactos.
- Si la notificación falla, mostrar alerta en el dashboard de administración.

## Escenario: No duplicar notificaciones

- Ningún usuario debe recibir dos notificaciones por el mismo evento.
- Si ocurre un error de reintento, registrar solo un log y evitar spam.

## Escenario: Notificación de cancelación

- Al cancelar una cita, tanto cliente como empleado deben ser notificados inmediatamente.
- El mensaje debe indicar quién realizó la cancelación y el motivo si está disponible.
