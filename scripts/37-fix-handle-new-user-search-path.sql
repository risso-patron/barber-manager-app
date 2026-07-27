-- ================================================================
-- Script 37 — Fix: handle_new_user() no resolvía el tipo no
-- calificado `user_role` durante la ejecución real del trigger
-- (encontrado durante validación E2E de R-1, 2026-07-13).
--
-- La causa fue confirmada por Postgres Logs: al crear un usuario
-- nuevo vía Supabase Auth, el trigger `on_auth_user_created` lanzó
-- `type "user_role" does not exist`, absorbido en silencio por el
-- bloque EXCEPTION ya existente (heredado de
-- scripts/04-fix-auth-policies.sql). Efecto: auth.users se creaba,
-- public.users no — usuario huérfano sin perfil.
--
-- La solución fija un search_path vacío (patrón restrictivo
-- recomendado para funciones SECURITY DEFINER) y califica
-- explícitamente `public.user_role` en ambos casts. El bloque de
-- excepción se conserva sin cambios.
--
-- Alcance: exclusivamente esta función. Cero tablas, cero enums,
-- cero RLS, cero grants/owners, el trigger sigue AFTER INSERT en
-- auth.users sin recrearse.
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.users (
    id,
    name,
    email,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'client'::public.user_role
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK: NO reconstruir manualmente. Antes de aplicar este
-- script, capturar la definición exacta desplegada con:
--
--   SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure);
--
-- y restaurar exactamente ese texto capturado si hace falta revertir.
-- ──────────────────────────────────────────────────────────────

SELECT 'Script 37 aplicado: handle_new_user() con search_path vacío y user_role calificado' AS status;
