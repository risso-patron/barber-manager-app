-- Script para limpiar usuario problemático y empezar de cero
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar usuario de la tabla public.users
DELETE FROM public.users WHERE email = 'luisrissopa@gmail.com';

-- 2. Eliminar usuario de auth.users
DELETE FROM auth.users WHERE email = 'luisrissopa@gmail.com';

-- 3. Verificar que se eliminaron
SELECT 'Usuario eliminado correctamente. Ahora puedes registrarte de nuevo.' AS status;
