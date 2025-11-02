-- Verificar el usuario actual y su rol
-- Este script te ayuda a diagnosticar problemas de roles

-- 1. Ver todos los usuarios en la tabla users
SELECT id, name, email, role, created_at 
FROM users 
ORDER BY created_at;

-- 2. Ver usuarios de Supabase Auth
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
ORDER BY created_at;

-- 3. Verificar si el email del usuario logueado está en la tabla users
-- Reemplaza 'tu-email@gmail.com' con tu email de login
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  au.id as auth_id,
  au.email as auth_email
FROM users u
FULL OUTER JOIN auth.users au ON u.email = au.email
WHERE au.email = 'luisrissopa@gmail.com'; -- Cambia esto por tu email

-- 4. Si el usuario existe en auth pero no en users, necesitas crear el registro
-- Ejecuta esto SOLO si el query anterior no retorna resultados:
/*
INSERT INTO users (id, name, email, role, created_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', 'Admin User'),
  email,
  'admin',
  created_at
FROM auth.users
WHERE email = 'luisrissopa@gmail.com'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'luisrissopa@gmail.com');
*/

-- 5. Si existe pero tiene rol incorrecto, actualízalo:
/*
UPDATE users 
SET role = 'admin' 
WHERE email = 'luisrissopa@gmail.com';
*/
