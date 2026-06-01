-- Migrar specialty de texto libre a enum controlado
-- Valores permitidos: barbero | cajero | recepcionista | gerente

-- 1. Normalizar valores existentes (mayúscula → minúscula)
UPDATE public.users
SET specialty = LOWER(specialty)
WHERE specialty IS NOT NULL;

-- 2. Corregir valores legacy del script 08 (ej. "Barbero" → "barbero")
UPDATE public.users
SET specialty = 'barbero'
WHERE specialty IN ('barbero', 'estilista', 'colorista');

UPDATE public.users
SET specialty = NULL
WHERE specialty IS NOT NULL
  AND specialty NOT IN ('barbero', 'cajero', 'recepcionista', 'gerente');

-- 3. Agregar CHECK constraint
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_specialty_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_specialty_check
  CHECK (specialty IS NULL OR specialty IN ('barbero', 'cajero', 'recepcionista', 'gerente'));

-- 4. Comentario actualizado
COMMENT ON COLUMN public.users.specialty IS 'Especialidad del empleado: barbero | cajero | recepcionista | gerente';
