-- Agregar columna specialty a users para guardar el rol detallado del empleado
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS specialty TEXT;

-- Comentario
COMMENT ON COLUMN public.users.specialty IS 'Especialidad del empleado: Barbero, Manicurista, Masajista, etc.';
