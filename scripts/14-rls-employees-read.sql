-- Permite a todos los usuarios (incluyendo invitados) leer perfiles de empleados
-- (necesario para mostrar la lista de barberos al reservar)
DROP POLICY IF EXISTS "Everyone can read employees" ON public.users;

CREATE POLICY "Everyone can read employees"
  ON public.users
  FOR SELECT
  USING (role = 'employee'::user_role);
