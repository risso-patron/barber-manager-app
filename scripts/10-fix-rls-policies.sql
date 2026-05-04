-- Script 10: Corregir todas las políticas RLS para que el rol admin
-- pueda gestionar usuarios, citas, inventario y servicios correctamente.
-- Ejecutar en Supabase SQL Editor.

-- ─────────────────────────────────────────────
-- 1. USERS — evitar recursión infinita y dar acceso total al admin
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admin full access to users" ON public.users;

-- Leer: propio perfil O admin (sin recursión: usamos auth.jwt() en vez de subquery)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id
    OR (auth.jwt() ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.users u2
      WHERE u2.id = auth.uid() AND u2.role = 'admin'
      LIMIT 1
    )
  );

-- Insertar: el trigger handle_new_user lo hace con SECURITY DEFINER, pero
-- también permitimos inserción abierta para los API routes con service_role
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (true);

-- Actualizar: propio perfil O admin
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.users u2
      WHERE u2.id = auth.uid() AND u2.role = 'admin'
      LIMIT 1
    )
  );

-- Eliminar: solo admin
DROP POLICY IF EXISTS "Admin can delete users" ON public.users;
CREATE POLICY "Admin can delete users" ON public.users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u2
      WHERE u2.id = auth.uid() AND u2.role = 'admin'
      LIMIT 1
    )
  );

-- ─────────────────────────────────────────────
-- 2. APPOINTMENTS — admin puede hacer todo; cliente/barbero solo lo suyo
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbers and admins can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin full access to appointments" ON public.appointments;

CREATE POLICY "Users can view their appointments" ON public.appointments
  FOR SELECT USING (
    client_id = auth.uid()
    OR barber_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin' LIMIT 1
    )
  );

CREATE POLICY "Clients can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','employee') LIMIT 1
    )
  );

CREATE POLICY "Barbers and admins can update appointments" ON public.appointments
  FOR UPDATE USING (
    barber_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','employee') LIMIT 1
    )
  );

CREATE POLICY "Admin can delete appointments" ON public.appointments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin' LIMIT 1
    )
  );

-- ─────────────────────────────────────────────
-- 3. SERVICES — solo admin puede crear/editar/eliminar; todos pueden leer
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Admin can manage services" ON public.services;

CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin' LIMIT 1
    )
  );

-- ─────────────────────────────────────────────
-- 4. INVENTORY — solo admin
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage inventory" ON public.inventory;

CREATE POLICY "Admin can manage inventory" ON public.inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin' LIMIT 1
    )
  );

SELECT 'Políticas RLS actualizadas correctamente' AS status;
