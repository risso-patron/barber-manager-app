-- ================================================================
-- Script 30 — Bloqueos de agenda para barberos (schedule_blocks)
-- Permite registrar ausencias, descansos y bloqueos de horario
-- que impiden reservas automáticas en ese tramo.
-- Ejecutar en Supabase SQL Editor DESPUÉS del script 29.
-- ================================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Crear tabla schedule_blocks
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schedule_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  block_date  DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  reason      TEXT NOT NULL DEFAULT 'Bloqueo',
  block_type  TEXT NOT NULL DEFAULT 'break'
                CHECK (block_type IN ('break','absence','personal','vacation')),
  created_by  UUID REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT  schedule_blocks_time_order CHECK (end_time > start_time)
);

-- ──────────────────────────────────────────────────────────────
-- 2. Índice de consulta frecuente (barber + fecha)
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_barber_date
  ON public.schedule_blocks(barber_id, block_date);

-- ──────────────────────────────────────────────────────────────
-- 3. Activar RLS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

-- El propio barbero ve sus bloques
CREATE POLICY "barber_select_own_blocks" ON public.schedule_blocks
  FOR SELECT USING (
    barber_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'manager')
  );

-- El propio barbero puede crear sus bloqueos
CREATE POLICY "barber_insert_own_blocks" ON public.schedule_blocks
  FOR INSERT WITH CHECK (
    barber_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'manager')
  );

-- El propio barbero o admin/manager puede eliminar
CREATE POLICY "barber_delete_own_blocks" ON public.schedule_blocks
  FOR DELETE USING (
    barber_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'manager')
  );

SELECT 'Script 30 aplicado: tabla schedule_blocks creada con RLS' AS status;
