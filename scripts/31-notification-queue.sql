-- ================================================================
-- Script 31 — Cola de notificaciones (notification_queue)
-- Almacena notificaciones pendientes de envío (email / SMS).
-- Procesada por la Edge Function process-notification-queue.
-- [2026-07-10, R-1/ADR-028] La Edge Function fue eliminada del repo;
-- la cola la procesa el cron de Vercel (/api/cron/send-reminders).
-- Ver scripts/36-notification-queue-tenant.sql.
-- Ejecutar en Supabase SQL Editor DESPUÉS del script 30.
-- ================================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Crear tabla notification_queue
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT        NOT NULL
                              CHECK (type IN (
                                'appointment_created',
                                'reminder',
                                'cancellation',
                                'confirmation'
                              )),
  recipient_phone TEXT,
  recipient_email TEXT,
  recipient_name  TEXT,
  message_sms     TEXT,
  message_email   TEXT,
  subject_email   TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','processing','sent','failed')),
  error_message   TEXT,
  attempts        INT         NOT NULL DEFAULT 0,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at         TIMESTAMPTZ,
  CONSTRAINT notification_queue_has_recipient
    CHECK (recipient_phone IS NOT NULL OR recipient_email IS NOT NULL)
);

-- ──────────────────────────────────────────────────────────────
-- 2. Índice para lectura eficiente de pendientes
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending
  ON public.notification_queue(status, created_at)
  WHERE status = 'pending';

-- ──────────────────────────────────────────────────────────────
-- 3. Activar RLS
--    La Edge Function usa service_role → bypasa RLS.
--    Admin/manager pueden monitorear la cola desde el panel.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_notification_queue" ON public.notification_queue
  FOR SELECT USING (public.get_my_role() IN ('admin', 'manager'));

CREATE POLICY "admin_update_notification_queue" ON public.notification_queue
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'manager'));

SELECT 'Script 31 aplicado: tabla notification_queue creada con RLS' AS status;
