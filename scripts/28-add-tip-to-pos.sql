-- ================================================================
-- Script 28 — Propinas en POS (tip)
-- Agrega columna 'tip' a pos_sales para registrar la propina
-- dejada por el cliente en cada venta.
-- Ejecutar en Supabase SQL Editor DESPUÉS del script 27.
-- ================================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Agregar columna tip a pos_sales (nullable, default 0)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.pos_sales
  ADD COLUMN IF NOT EXISTS tip NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (tip >= 0);

-- ──────────────────────────────────────────────────────────────
-- 2. Actualizar la vista/reporte si existe (no-op si no existe)
-- ──────────────────────────────────────────────────────────────
-- No hay vistas dependientes actualmente — no se requiere acción.

SELECT 'Script 28 aplicado: columna tip agregada a pos_sales' AS status;
