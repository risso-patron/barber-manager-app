-- ================================================================
-- Script 36 — notification_queue: atribución por tenant + dedup
-- de recordatorios (R-1, ADR-028).
-- Ejecutar en Supabase SQL Editor DESPUÉS del script 35.
--
-- Contexto: el pipeline de recordatorios nace multi-tenant.
-- tenant_id sigue el patrón latente de ADR-016 (uuid sin FK — no
-- existe tabla tenants todavía) PERO acá sí se escribe desde el
-- día uno: toda notificación queda atribuida a su tenant para que
-- el metering de planes futuros sea un simple COUNT.
-- ================================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Columnas nuevas
--    - tenant_id: atribución (DEFAULT_TENANT_ID de lib/tenants.ts
--      hasta que exista la tabla tenants; su seed usará ese mismo id).
--    - appointment_id + reminder_offset_hours: ancla de dedup de
--      recordatorios (una cita × un offset = un recordatorio).
--    - processing_at: timestamp del reclamo; permite devolver a
--      pending filas atascadas en processing por un worker muerto.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.notification_queue
  ADD COLUMN IF NOT EXISTS tenant_id             UUID,
  ADD COLUMN IF NOT EXISTS appointment_id        UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reminder_offset_hours INT,
  ADD COLUMN IF NOT EXISTS processing_at         TIMESTAMPTZ;

-- ──────────────────────────────────────────────────────────────
-- 2. Índice UNIQUE de dedup — la garantía vive en la DB, no en la
--    aplicación: N workers concurrentes insertan cada recordatorio
--    UNA sola vez (upsert con ignoreDuplicates = ON CONFLICT DO NOTHING).
--
--    Índice COMPLETO a propósito (no parcial WHERE type='reminder'):
--    PostgREST no puede inferir índices parciales en ON CONFLICT.
--    Las filas que no son recordatorios llevan NULL en ambas columnas
--    y los NULL nunca colisionan entre sí (NULLS DISTINCT, default).
-- ──────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_queue_reminder
  ON public.notification_queue (appointment_id, reminder_offset_hours);

-- ──────────────────────────────────────────────────────────────
-- 3. Timezone del tenant en business_settings ('business').
--    Seed de referencia: America/Panama (UTC-5, sin DST).
--    NO está hardcodeada en el código: cualquier IANA válido gana;
--    si falta o es inválida, lib/tenants.ts cae a este mismo valor.
--    setting_value es TEXT (script 01) → cast a jsonb y de vuelta.
-- ──────────────────────────────────────────────────────────────
UPDATE public.business_settings
SET setting_value = jsonb_set(
      setting_value::jsonb,
      '{timezone}',
      '"America/Panama"',
      true
    )::text
WHERE setting_key = 'business'
  AND NOT (setting_value::jsonb ? 'timezone');

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK (documentado, no ejecutar):
--   DROP INDEX IF EXISTS public.uq_notification_queue_reminder;
--   ALTER TABLE public.notification_queue
--     DROP COLUMN IF EXISTS tenant_id,
--     DROP COLUMN IF EXISTS appointment_id,
--     DROP COLUMN IF EXISTS reminder_offset_hours,
--     DROP COLUMN IF EXISTS processing_at;
--   UPDATE public.business_settings
--     SET setting_value = (setting_value::jsonb - 'timezone')::text
--     WHERE setting_key = 'business';
-- ──────────────────────────────────────────────────────────────

SELECT 'Script 36 aplicado: notification_queue multi-tenant + dedup de recordatorios' AS status;
