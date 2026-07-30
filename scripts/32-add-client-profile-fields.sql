-- ================================================================
-- Script 32 — CRM Fase B (1/3): campos de perfil de cliente
-- Agrega birthday, allergies, preferred_employee_id y marketing_consent
-- a la tabla users. Ejecutar en Supabase SQL Editor DESPUÉS del script 31.
--
-- No se agregan políticas RLS nuevas: la tabla users ya tiene
-- "Users can view own profile" / "Users can update own profile"
-- (scripts 01/04/10/11/27), que son políticas a nivel de fila, no de
-- columna — las columnas nuevas quedan cubiertas automáticamente por
-- esas políticas existentes, igual que admin_notes (script 12).
--
-- Sin tenant_id: users migra como tabla completa cuando se implemente
-- el schema multi-tenant (M1) — ver project-brain/04_DECISIONS.md ADR-016.
-- ================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_employee_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_preferred_employee_id ON public.users(preferred_employee_id);

SELECT 'Script 32 aplicado: birthday, allergies, marketing_consent, preferred_employee_id agregados a users' AS status;
