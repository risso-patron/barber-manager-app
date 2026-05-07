-- Agrega campo de notas del admin en public.users
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

COMMENT ON COLUMN public.users.admin_notes IS
  'Notas privadas del administrador sobre el cliente (preferencias, productos de interés, etc.)';
