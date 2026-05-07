-- =============================================================
-- Script 16 — Mensajes y Regalos de admin a clientes
-- Ejecutar en Supabase SQL Editor
-- =============================================================

-- Tabla de mensajes del admin al cliente
CREATE TABLE IF NOT EXISTS public.client_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_admin_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  to_client_id  uuid REFERENCES public.users(id) ON DELETE CASCADE,
  subject       text,
  message       text NOT NULL,
  is_read       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Tabla de regalos / descuentos del admin al cliente
CREATE TABLE IF NOT EXISTS public.client_gifts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_admin_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  to_client_id  uuid REFERENCES public.users(id) ON DELETE CASCADE,
  gift_type     text NOT NULL CHECK (gift_type IN ('discount_pct', 'discount_fixed', 'free_service', 'free_product')),
  title         text NOT NULL,
  description   text,
  value         numeric(10,2),        -- % o monto según tipo
  service_name  text,                 -- para free_service
  product_name  text,                 -- para free_product
  code          text UNIQUE NOT NULL DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  is_redeemed   boolean NOT NULL DEFAULT false,
  redeemed_at   timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_gifts    ENABLE ROW LEVEL SECURITY;

-- Admins pueden insertar y leer todos
CREATE POLICY "Admins can manage messages"
  ON public.client_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

CREATE POLICY "Admins can manage gifts"
  ON public.client_gifts FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

-- Clientes solo pueden leer sus propios mensajes y regalos
CREATE POLICY "Clients can read own messages"
  ON public.client_messages FOR SELECT
  TO authenticated
  USING (to_client_id = auth.uid());

CREATE POLICY "Clients can read own gifts"
  ON public.client_gifts FOR SELECT
  TO authenticated
  USING (to_client_id = auth.uid());

-- Clientes pueden marcar sus mensajes como leídos
CREATE POLICY "Clients can mark messages as read"
  ON public.client_messages FOR UPDATE
  TO authenticated
  USING (to_client_id = auth.uid())
  WITH CHECK (to_client_id = auth.uid());

-- Clientes pueden marcar sus regalos como canjeados
CREATE POLICY "Clients can redeem own gifts"
  ON public.client_gifts FOR UPDATE
  TO authenticated
  USING (to_client_id = auth.uid())
  WITH CHECK (to_client_id = auth.uid());

-- Campo admin_notes en users (si no existe aún)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS admin_notes text;
