-- Add category column to inventory table
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'suministro';
