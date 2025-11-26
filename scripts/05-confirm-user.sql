-- Opción 1: Confirmar manualmente el usuario que acabas de crear
-- Reemplaza 'luisrissopa@gmail.com' con tu email

UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'luisrissopa@gmail.com';

-- Opción 2: Ver todos los usuarios no confirmados
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email_confirmed_at IS NULL;
