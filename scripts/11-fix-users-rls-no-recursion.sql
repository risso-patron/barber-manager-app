-- Script 11: Corregir recursión infinita en políticas RLS de la tabla users.
-- El problema: la política SELECT de users hacía un subquery a la misma tabla
-- (SELECT 1 FROM public.users u2 WHERE ...) causando recursión infinita que
-- bloquea todas las queries sobre users para el admin.
--
-- Solución: usar auth.jwt() para leer el role del token sin tocar public.users.
-- El role se guarda en app_metadata por el trigger handle_new_user.
-- Ejecutar en Supabase SQL Editor.

-- Helper: función que lee el role del JWT sin recursión
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1
$$;

-- ─────────────────────────────────────────────
-- USERS — políticas sin recursión
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can delete users" ON public.users;

-- SELECT: propio perfil o admin
-- get_my_role() usa SECURITY DEFINER, bypasea RLS internamente → no recursión
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id
    OR public.get_my_role() = 'admin'
  );

-- INSERT: siempre permitido (lo manejan los API routes con service_role)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (true);

-- UPDATE: propio perfil o admin
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (
    auth.uid() = id
    OR public.get_my_role() = 'admin'
  );

-- DELETE: solo admin
CREATE POLICY "Admin can delete users" ON public.users
  FOR DELETE USING (
    public.get_my_role() = 'admin'
  );

-- ─────────────────────────────────────────────
-- APPOINTMENTS — actualizar usando get_my_role()
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbers and admins can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin can delete appointments" ON public.appointments;

CREATE POLICY "Users can view their appointments" ON public.appointments
  FOR SELECT USING (
    client_id = auth.uid()
    OR barber_id = auth.uid()
    OR public.get_my_role() = 'admin'
  );

CREATE POLICY "Clients can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    client_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'employee')
  );

CREATE POLICY "Barbers and admins can update appointments" ON public.appointments
  FOR UPDATE USING (
    barber_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'employee')
  );

CREATE POLICY "Admin can delete appointments" ON public.appointments
  FOR DELETE USING (
    public.get_my_role() = 'admin'
  );

-- ─────────────────────────────────────────────
-- SERVICES e INVENTORY — usar get_my_role()
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage services" ON public.services;
CREATE POLICY "Admin can manage services" ON public.services
  FOR ALL USING (
    public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admin can manage inventory" ON public.inventory;
CREATE POLICY "Admin can manage inventory" ON public.inventory
  FOR ALL USING (
    public.get_my_role() = 'admin'
  );

-- TIME_LOGS — empleados ven los suyos, admin ve todos
DROP POLICY IF EXISTS "Employees can view own time logs" ON public.time_logs;
DROP POLICY IF EXISTS "Employees can manage own time logs" ON public.time_logs;

CREATE POLICY "Employees can view own time logs" ON public.time_logs
  FOR SELECT USING (
    employee_id = auth.uid()
    OR public.get_my_role() = 'admin'
  );

CREATE POLICY "Employees can manage own time logs" ON public.time_logs
  FOR ALL USING (
    employee_id = auth.uid()
    OR public.get_my_role() = 'admin'
  );

SELECT 'Script 11 aplicado: recursión infinita corregida en RLS de users' AS status;
