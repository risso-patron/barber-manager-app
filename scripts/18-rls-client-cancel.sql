-- =============================================================
-- Script 18 — Permitir que clientes cancelen sus propias citas
-- Ejecutar en Supabase SQL Editor
-- =============================================================
-- El script 11 dejó la política de UPDATE solo para barbers/admins.
-- Los clientes necesitan poder cambiar status → 'cancelled' en sus citas.

-- Agregar política de cancelación para clientes
DROP POLICY IF EXISTS "Clients can cancel own appointments" ON public.appointments;

CREATE POLICY "Clients can cancel own appointments"
  ON public.appointments
  FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (
    client_id = auth.uid()
    AND status = 'cancelled'
  );
