-- Agregar columna de rol a la tabla employees
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee'));

-- Actualizar el primer empleado como admin (ajusta el email según tu empleado admin)
UPDATE employees 
SET role = 'admin' 
WHERE email LIKE '%admin%' OR id = (SELECT id FROM employees ORDER BY created_at LIMIT 1);

-- Asegurar que todos los demás sean 'employee'
UPDATE employees 
SET role = 'employee' 
WHERE role IS NULL;
