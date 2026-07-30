-- ================================================================
-- Script 35 — Billing Fase A: schema real de suscripción y facturas
-- Ejecutar en Supabase SQL Editor DESPUÉS del script 34.
--
-- Esta fase NO integra un proveedor de pagos todavía (ver
-- project-brain/04_DECISIONS.md — decisión de proveedor pendiente).
-- Este script solo reemplaza los datos 100% inventados que hoy
-- muestra app/admin/billing/page.tsx (facturas y tarjetas de
-- fantasía) por un schema real, vacío hasta que haya un proveedor
-- conectado.
--
-- tenant_id: columna latente, sin uso ni FK todavía (no existe tabla
-- tenants). Ver project-brain/04_DECISIONS.md ADR-016.
--
-- RLS: solo admin, ni siquiera manager — datos financieros del
-- negocio, mismo criterio que employee_commissions (script 27).
-- ================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid,                                    -- latente — ver nota arriba
  plan_name                text        NOT NULL,
  status                   text        NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  price                    numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  billing_cycle            text        NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  payment_provider         text        CHECK (payment_provider IN ('stripe', 'mercado_pago')),
  provider_customer_id     text,
  provider_subscription_id text,
  current_period_end       date,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid,                                             -- latente — ver nota arriba
  subscription_id uuid        REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_number  text        NOT NULL,
  amount          numeric(10,2) NOT NULL CHECK (amount >= 0),
  currency        text        NOT NULL DEFAULT 'USD',
  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  issued_at        timestamptz NOT NULL DEFAULT now(),
  paid_at          timestamptz,
  pdf_url          text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at        ON public.invoices(issued_at DESC);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "admin_only_invoices"
  ON public.invoices FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

SELECT 'Script 35 aplicado: tablas subscriptions e invoices creadas con RLS (solo admin)' AS status;
