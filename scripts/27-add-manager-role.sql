-- ================================================================
-- Script 27 — Rol Manager/Encargado
-- Agrega 'manager' como rol técnico con permisos intermedios.
-- Ejecutar en Supabase SQL Editor DESPUÉS del script 26.
--
-- El Manager puede:
--   appointments     → SELECT global + UPDATE global
--   inventory        → SELECT + INSERT + UPDATE
--   low_rating_alerts→ SELECT + UPDATE (resolver alertas)
--   business_settings→ SELECT (solo lectura)
--   pos_sales        → SELECT + INSERT (operar caja)
--   pos_sale_items   → SELECT + INSERT (líneas de venta)
--   loyalty_transactions → SELECT + INSERT (ajustar puntos)
--
-- El Manager NO puede:
--   employee_commissions → sin acceso (datos financieros exclusivo admin)
--   business_settings    → sin UPDATE/DELETE
--   users                → sin UPDATE/DELETE de otros usuarios
-- ================================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Extender el ENUM user_role con el valor 'manager'.
--    Si ya existe el valor, la sentencia falla silenciosamente
--    gracias a IF NOT EXISTS (PostgreSQL 9.6+).
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'manager'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'manager';
  END IF;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 2. USERS — el manager puede ver todos los perfiles
--    (necesita ver clientes y empleados para su trabajo)
--    UPDATE y DELETE siguen siendo solo admin.
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id
    OR public.get_my_role() IN ('admin', 'manager')
  );

-- ──────────────────────────────────────────────────────────────
-- 3. APPOINTMENTS — manager tiene visibilidad global y puede
--    actualizar cualquier cita (no solo las de su barbero).
--    DELETE sigue siendo solo admin.
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their appointments" ON public.appointments;

CREATE POLICY "Users can view their appointments" ON public.appointments
  FOR SELECT USING (
    client_id = auth.uid()
    OR barber_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'manager')
  );

DROP POLICY IF EXISTS "Clients can create appointments" ON public.appointments;

CREATE POLICY "Clients can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    client_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'manager', 'employee')
  );

DROP POLICY IF EXISTS "Barbers and admins can update appointments" ON public.appointments;

CREATE POLICY "Barbers and admins can update appointments" ON public.appointments
  FOR UPDATE USING (
    barber_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'manager', 'employee')
  );

-- ──────────────────────────────────────────────────────────────
-- 4. INVENTORY — manager puede INSERT y UPDATE
--    (SELECT ya funciona vía política authenticated del script 15)
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Manager can insert inventory" ON public.inventory;
DROP POLICY IF EXISTS "Manager can update inventory" ON public.inventory;

CREATE POLICY "Manager can insert inventory" ON public.inventory
  FOR INSERT WITH CHECK (
    public.get_my_role() IN ('admin', 'manager')
  );

CREATE POLICY "Manager can update inventory" ON public.inventory
  FOR UPDATE USING (
    public.get_my_role() IN ('admin', 'manager')
  );

-- ──────────────────────────────────────────────────────────────
-- 5. LOW_RATING_ALERTS — reemplazar la política del script 26
--    (usaba EXISTS sobre users — consistencia con get_my_role())
--    Manager: SELECT + UPDATE para resolver alertas.
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_low_rating_alerts" ON public.low_rating_alerts;

-- Admin sigue teniendo acceso total
CREATE POLICY "admin_all_low_rating_alerts" ON public.low_rating_alerts
  FOR ALL USING (
    public.get_my_role() = 'admin'
  );

-- Manager: puede leer alertas
DROP POLICY IF EXISTS "manager_select_low_rating_alerts" ON public.low_rating_alerts;

CREATE POLICY "manager_select_low_rating_alerts" ON public.low_rating_alerts
  FOR SELECT USING (
    public.get_my_role() = 'manager'
  );

-- Manager: puede marcar alertas como resueltas
DROP POLICY IF EXISTS "manager_update_low_rating_alerts" ON public.low_rating_alerts;

CREATE POLICY "manager_update_low_rating_alerts" ON public.low_rating_alerts
  FOR UPDATE USING (
    public.get_my_role() = 'manager'
  );

-- ──────────────────────────────────────────────────────────────
-- 6. BUSINESS_SETTINGS — manager solo lectura
--    No puede modificar configuración crítica del negocio.
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "manager_read_business_settings" ON public.business_settings;

CREATE POLICY "manager_read_business_settings" ON public.business_settings
  FOR SELECT USING (
    public.get_my_role() IN ('admin', 'manager')
  );

-- ──────────────────────────────────────────────────────────────
-- 7. POS_SALES — manager puede operar la caja (SELECT + INSERT)
--    UPDATE para correcciones menores de la misma sesión.
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "manager_select_pos_sales" ON public.pos_sales;
DROP POLICY IF EXISTS "manager_insert_pos_sales" ON public.pos_sales;

CREATE POLICY "manager_select_pos_sales" ON public.pos_sales
  FOR SELECT USING (
    public.get_my_role() IN ('admin', 'manager')
  );

CREATE POLICY "manager_insert_pos_sales" ON public.pos_sales
  FOR INSERT WITH CHECK (
    public.get_my_role() IN ('admin', 'manager')
  );

-- ──────────────────────────────────────────────────────────────
-- 8. POS_SALE_ITEMS — líneas de detalle de ventas POS
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "manager_select_pos_sale_items" ON public.pos_sale_items;
DROP POLICY IF EXISTS "manager_insert_pos_sale_items" ON public.pos_sale_items;

CREATE POLICY "manager_select_pos_sale_items" ON public.pos_sale_items
  FOR SELECT USING (
    public.get_my_role() IN ('admin', 'manager')
  );

CREATE POLICY "manager_insert_pos_sale_items" ON public.pos_sale_items
  FOR INSERT WITH CHECK (
    public.get_my_role() IN ('admin', 'manager')
  );

-- ──────────────────────────────────────────────────────────────
-- 9. LOYALTY_TRANSACTIONS — manager puede ver historial y
--    registrar ajustes manuales de puntos.
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "manager_select_loyalty_transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "manager_insert_loyalty_transactions" ON public.loyalty_transactions;

CREATE POLICY "manager_select_loyalty_transactions" ON public.loyalty_transactions
  FOR SELECT USING (
    public.get_my_role() IN ('admin', 'manager')
  );

CREATE POLICY "manager_insert_loyalty_transactions" ON public.loyalty_transactions
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'manager'
  );

-- ──────────────────────────────────────────────────────────────
-- 10. EMPLOYEE_COMMISSIONS — SIN acceso para manager
--     Las comisiones son datos financieros exclusivos del admin.
--     No se agrega ninguna política nueva.
-- ──────────────────────────────────────────────────────────────

SELECT 'Script 27 aplicado: rol manager creado con políticas RLS granulares' AS status;
