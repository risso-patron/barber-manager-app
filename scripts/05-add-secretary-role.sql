-- Script para agregar el rol de "secretary" (secretaria/asistente)
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar el nuevo valor al enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretary';

-- 2. Verificar que existe la columna is_active
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Actualizar usuarios existentes que no tienen is_active
UPDATE users 
SET is_active = true 
WHERE is_active IS NULL;

-- 4. Verificar los roles disponibles
SELECT enum_range(NULL::user_role);

-- 5. Ver usuarios con sus roles
SELECT id, name, email, role, is_active 
FROM users 
ORDER BY role, name;
