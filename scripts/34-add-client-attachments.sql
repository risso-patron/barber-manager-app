-- ================================================================
-- Script 34 — CRM Fase B (3/3): fotos y documentos de cliente
-- Ejecutar en Supabase SQL Editor DESPUÉS del script 33.
--
-- Introduce el primer uso de Supabase Storage en este proyecto —
-- no había ningún bucket previo (avatar_url en users, script 01,
-- nunca llegó a usar Storage realmente). Bucket privado: solo
-- admin/manager pueden subir y ver fotos/documentos de clientes,
-- los clientes no tienen acceso propio (a diferencia de
-- client_messages/client_gifts, script 16).
--
-- tenant_id: columna latente, ver project-brain/04_DECISIONS.md ADR-016.
-- ================================================================

-- 1. Bucket privado para adjuntos de clientes
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-attachments', 'client-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Metadata de cada archivo subido
CREATE TABLE IF NOT EXISTS public.client_attachments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid,                                   -- latente — ver nota arriba
  client_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  uploaded_by    uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  kind           text        NOT NULL CHECK (kind IN ('photo', 'document')),
  file_name      text        NOT NULL,
  storage_path   text        NOT NULL,                    -- ruta dentro del bucket client-attachments
  mime_type      text,
  size_bytes     integer,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_attachments_client_id ON public.client_attachments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_attachments_kind      ON public.client_attachments(kind);

ALTER TABLE public.client_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manager_all_client_attachments"
  ON public.client_attachments FOR ALL
  USING (public.get_my_role() IN ('admin', 'manager'))
  WITH CHECK (public.get_my_role() IN ('admin', 'manager'));

-- 3. RLS sobre los objetos del bucket — mismo criterio: solo admin/manager
CREATE POLICY "admin_manager_read_client_attachments_objects"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-attachments' AND public.get_my_role() IN ('admin', 'manager'));

CREATE POLICY "admin_manager_write_client_attachments_objects"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'client-attachments' AND public.get_my_role() IN ('admin', 'manager'));

CREATE POLICY "admin_manager_delete_client_attachments_objects"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'client-attachments' AND public.get_my_role() IN ('admin', 'manager'));

SELECT 'Script 34 aplicado: bucket client-attachments + tabla client_attachments creados con RLS' AS status;
