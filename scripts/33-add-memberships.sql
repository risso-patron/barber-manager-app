-- ================================================================
-- Script 33 — CRM Fase B (2/3): membresías de cliente
-- Ejecutar en Supabase SQL Editor DESPUÉS del script 32.
--
-- tenant_id: columna latente, sin uso ni FK todavía (no existe tabla
-- tenants). Se agrega ahora para que la migración multi-tenant (M1)
-- solo tenga que poblarla + activar RLS sobre ella, no crearla de cero.
-- Ver project-brain/04_DECISIONS.md ADR-016.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.memberships (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid,                                  -- latente — ver nota arriba
  client_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_name      text        NOT NULL,
  status         text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  billing_cycle  text        NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  price          numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  starts_at      date        NOT NULL DEFAULT CURRENT_DATE,
  ends_at        date,
  notes          text,
  created_by     uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memberships_client_id ON public.memberships(client_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status    ON public.memberships(status);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Admin y manager: acceso total (mismo patrón que script 27 — get_my_role())
CREATE POLICY "admin_manager_all_memberships"
  ON public.memberships FOR ALL
  USING (public.get_my_role() IN ('admin', 'manager'))
  WITH CHECK (public.get_my_role() IN ('admin', 'manager'));

-- Clientes: solo pueden leer sus propias membresías
CREATE POLICY "clients_read_own_memberships"
  ON public.memberships FOR SELECT
  USING (client_id = auth.uid());

SELECT 'Script 33 aplicado: tabla memberships creada con RLS' AS status;
