-- =============================================================
-- Script 14 — Política RLS para que clientes lean empleados
-- Ejecutar en Supabase SQL Editor
-- =============================================================

-- Permite a usuarios autenticados leer perfiles de empleados
-- (necesario para mostrar la lista de barberos al reservar)
DROP POLICY IF EXISTS "Authenticated users can read employees" ON public.users;

CREATE POLICY "Authenticated users can read employees"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (users.role = 'employee'::user_role);
