-- =============================================================
-- Script 17 — Guard de transiciones de estado en citas
-- Ejecutar en Supabase SQL Editor
-- =============================================================
-- Regla: 'cancelled' y 'completed' son estados terminales.
-- Ninguna actualización posterior de status está permitida.
-- Esto previene la condición de carrera donde el admin confirma
-- una cita que el cliente ya canceló.

CREATE OR REPLACE FUNCTION public.check_appointment_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IN ('cancelled', 'completed') AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION
      'La cita ya está en estado "%". No se puede cambiar a "%".',
      OLD.status, NEW.status
    USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

-- Eliminar trigger anterior si existe (idempotente)
DROP TRIGGER IF EXISTS appointment_status_guard ON public.appointments;

CREATE TRIGGER appointment_status_guard
  BEFORE UPDATE OF status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_appointment_status_transition();
