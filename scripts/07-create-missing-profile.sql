-- Ver qué usuario se creó y crear su perfil manualmente

-- 1. Ver el último usuario creado
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;

-- 2. Crear el perfil manualmente para ese usuario
-- (Ejecuta esto después de ver el resultado del paso 1)
-- Reemplaza el ID con el que aparezca en el resultado

INSERT INTO public.users (id, name, email, role, phone)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', 'Usuario'),
  email,
  'client',
  raw_user_meta_data->>'phone'
FROM auth.users 
WHERE email = 'luisrissopa@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar que se creó
SELECT id, name, email, role FROM public.users WHERE email = 'luisrissopa@gmail.com';
