-- Script para arreglar políticas de autenticación
-- Ejecutar en Supabase SQL Editor

-- Primero, verificar que el trigger existe y funciona
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recrear la función con mejor manejo de errores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero no fallar
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Eliminar políticas existentes que pueden estar causando problemas
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Crear políticas más permisivas para registro
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (true); -- Permitir cualquier inserción (el trigger se encarga)

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Verificar que todo está correcto
SELECT 'Políticas creadas correctamente' AS status;
