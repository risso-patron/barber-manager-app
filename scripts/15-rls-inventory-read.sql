-- =============================================================
-- Script 15 — RLS: clientes pueden leer inventario (productos)
-- Ejecutar en Supabase SQL Editor
-- =============================================================

CREATE POLICY "Authenticated users can read inventory"
  ON public.inventory
  FOR SELECT
  TO authenticated
  USING (true);
