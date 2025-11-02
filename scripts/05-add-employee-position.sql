-- Script para agregar el campo employee_position a la tabla users
-- Este campo define el tipo de empleado: barbero, dueño, recepcionista

-- Crear el tipo ENUM para employee_position
CREATE TYPE employee_position AS ENUM ('barbero', 'dueno', 'recepcionista');

-- Agregar la columna employee_position a la tabla users
-- Solo aplica para usuarios con role = 'barber' o 'admin'
ALTER TABLE public.users 
ADD COLUMN employee_position employee_position;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.users.employee_position IS 'Tipo de empleado: barbero (registra citas y ventas), dueno (contabilidad y compras), recepcionista (apoyo en limpieza ligera)';

-- Actualizar usuarios existentes con role 'admin' para asignarles posición 'dueno'
UPDATE public.users 
SET employee_position = 'dueno' 
WHERE role = 'admin';

-- Actualizar usuarios existentes con role 'barber' para asignarles posición 'barbero' por defecto
UPDATE public.users 
SET employee_position = 'barbero' 
WHERE role = 'barber';

-- Crear índice para mejorar consultas por employee_position
CREATE INDEX idx_users_employee_position ON public.users(employee_position);

-- Verificar los cambios
SELECT id, name, email, role, employee_position 
FROM public.users 
WHERE role IN ('barber', 'admin')
ORDER BY employee_position, name;
