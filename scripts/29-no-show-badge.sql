-- ================================================================
-- Script 29 — Badge no-show para clientes
-- Agrega columna 'no_show_count' a la tabla users para rastrear
-- cuántas veces un cliente no se presentó a su cita.
-- Ejecutar en Supabase SQL Editor DESPUÉS del script 28.
-- ================================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Agregar columna no_show_count a users
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS no_show_count INTEGER NOT NULL DEFAULT 0 CHECK (no_show_count >= 0);

-- ──────────────────────────────────────────────────────────────
-- 2. Función que incrementa no_show_count cuando una cita
--    cambia de estado a 'no_show'.
--    Se dispara como trigger AFTER UPDATE en appointments.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_no_show()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo actuar cuando el nuevo estado pasa a 'no_show'
  -- y el estado anterior era diferente
  IF NEW.status = 'no_show' AND OLD.status <> 'no_show' THEN
    UPDATE public.users
      SET no_show_count = no_show_count + 1
      WHERE id = NEW.client_id;
  END IF;

  -- Si se revierte desde 'no_show' a otro estado, decrementar
  IF OLD.status = 'no_show' AND NEW.status <> 'no_show' THEN
    UPDATE public.users
      SET no_show_count = GREATEST(0, no_show_count - 1)
      WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 3. Trigger: ejecutar handle_no_show en cada UPDATE de citas
-- ──────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_no_show ON public.appointments;

CREATE TRIGGER trg_no_show
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_no_show();

-- ──────────────────────────────────────────────────────────────
-- 4. Agregar 'no_show' al ENUM appointment_status
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'appointment_status' AND e.enumlabel = 'no_show'
  ) THEN
    ALTER TYPE public.appointment_status ADD VALUE 'no_show';
  END IF;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 5. Actualizar el guard de transiciones (script 17) para que
--    'no_show' también sea un estado terminal (no reversible).
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_appointment_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IN ('cancelled', 'completed', 'no_show') AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION
      'La cita ya está en estado "%". No se puede cambiar a "%".',
      OLD.status, NEW.status
    USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

SELECT 'Script 29 aplicado: no_show_count + trigger + opción no_show en citas' AS status;
