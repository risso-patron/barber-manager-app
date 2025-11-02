-- NOTA: La tabla 'users' ya tiene la columna 'role' con tipo ENUM user_role ('client', 'employee', 'admin')
-- Solo necesitamos actualizar los roles existentes

-- Actualizar el primer usuario como admin (ajusta el email según tu usuario admin)
UPDATE users 
SET role = 'admin' 
WHERE email LIKE '%admin%' OR id = (SELECT id FROM users WHERE role IN ('employee', 'admin') ORDER BY created_at LIMIT 1);

-- Verificar que existan usuarios con role 'employee' o 'admin'
-- Los clientes seguirán con role = 'client'
-- No es necesario actualizar nada más porque el esquema ya existe
