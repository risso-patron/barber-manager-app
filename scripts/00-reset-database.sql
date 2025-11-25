-- ⚠️ ADVERTENCIA: Este script ELIMINARÁ todas las tablas y datos existentes
-- Solo ejecutar en desarrollo o si quieres empezar de cero

-- Eliminar triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar funciones
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Eliminar políticas RLS (se eliminan automáticamente con las tablas)

-- Eliminar tablas en orden inverso para respetar dependencias
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.time_logs CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.business_settings CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Eliminar tipos personalizados
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Mensaje de confirmación
SELECT 'Base de datos limpiada exitosamente. Ahora ejecuta 01-create-tables.sql' AS status;
