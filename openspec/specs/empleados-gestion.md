# Especificación: Gestión de Empleados

## Escenario: Alta de empleado con credenciales completas

**Given** el entorno tiene `SUPABASE_SERVICE_ROLE_KEY` configurada  
**And** el usuario autenticado tiene rol `admin`  
**When** envía un POST a `/api/employees` con nombre, email, teléfono y rol válidos  
**Then** el sistema crea el usuario en Supabase Auth y el perfil en `public.users`  
**And** responde con el perfil creado y la contraseña temporal generada  
**And** si la inserción del perfil falla, hace rollback eliminando el usuario de Auth

## Escenario: Alta de empleado con service role key ausente

**Given** el entorno no tiene `SUPABASE_SERVICE_ROLE_KEY` configurada  
**When** un admin intenta crear un nuevo empleado via `POST /api/employees`  
**Then** el sistema responde con `500 Internal Server Error`  
**And** el mensaje de error indica las variables de entorno faltantes  
**And** el rest de la aplicación sigue funcionando (sin crash a nivel de módulo)

## Escenario: Baja de empleado

**Given** el usuario autenticado tiene rol `admin`  
**When** admin elimina un empleado existente  
**Then** el sistema desactiva el acceso y lo remueve de agendas futuras

## Escenario: Edición de empleado

**Given** el usuario autenticado tiene rol `admin`  
**When** admin edita datos de un empleado  
**Then** el sistema actualiza la información y registra el cambio

## Escenario: Visualización de agenda personal

**Given** un empleado autenticado  
**When** accede a su agenda  
**Then** el sistema muestra solo citas asignadas a ese empleado

## Escenario: Control de horarios y pausas

**Given** un empleado autenticado  
**When** registra entrada, salida y pausas  
**Then** el sistema almacena los eventos y calcula horas trabajadas
