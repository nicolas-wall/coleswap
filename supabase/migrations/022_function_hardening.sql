-- ============================================================
-- Hardening de funciones: search_path fijo + no exponerlas como RPC
-- ============================================================

-- search_path mutable en una función SECURITY DEFINER permite que quien la
-- invoca resuelva nombres de tablas/operadores hacia un esquema propio y
-- ejecute código con los privilegios del dueño de la función.
ALTER FUNCTION get_my_school_id()                    SET search_path = public, pg_temp;
ALTER FUNCTION is_school_admin()                     SET search_path = public, pg_temp;
ALTER FUNCTION is_platform_admin()                   SET search_path = public, pg_temp;
ALTER FUNCTION is_conversation_participant(uuid)     SET search_path = public, pg_temp;
ALTER FUNCTION touch_conversation_last_message()     SET search_path = public, pg_temp;
ALTER FUNCTION check_rate_limit(text, int, int)      SET search_path = public, pg_temp;
ALTER FUNCTION enforce_storage_upload_rate_limit()   SET search_path = public, pg_temp;
ALTER FUNCTION can_rate(uuid, rating_role, uuid)     SET search_path = public, pg_temp;
ALTER FUNCTION refresh_family_rating()               SET search_path = public, pg_temp;

-- Las funciones que solo disparan triggers no necesitan ser invocables como
-- endpoints /rest/v1/rpc/*: los triggers las ejecutan como dueño de la tabla.
REVOKE EXECUTE ON FUNCTION touch_conversation_last_message()   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION enforce_storage_upload_rate_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION refresh_family_rating()             FROM PUBLIC, anon, authenticated;

-- Los helpers usados DENTRO de políticas RLS sí necesitan EXECUTE: la expresión
-- de una política se evalúa con los privilegios de quien consulta, así que
-- revocarlos vacía las tablas para los usuarios legítimos. Quedan expuestos como
-- RPC, pero solo devuelven datos del propio usuario (su colegio, su rol, si
-- participa de una conversación), así que no filtran nada nuevo.
REVOKE EXECUTE ON FUNCTION get_my_school_id()                  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION is_school_admin()                   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION is_platform_admin()                 FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION is_conversation_participant(uuid)   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION can_rate(uuid, rating_role, uuid)   FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_my_school_id()                TO authenticated;
GRANT EXECUTE ON FUNCTION is_school_admin()                 TO authenticated;
GRANT EXECUTE ON FUNCTION is_platform_admin()               TO authenticated;
GRANT EXECUTE ON FUNCTION is_conversation_participant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_rate(uuid, rating_role, uuid) TO authenticated;

-- Los buckets son públicos por URL; no hace falta además poder listar todo el
-- contenido. Restringir el SELECT a la propia carpeta corta el enumerado de
-- fotos de otras familias sin romper el acceso por URL pública.
DROP POLICY IF EXISTS "listing_images_public_read" ON storage.objects;
CREATE POLICY "listing_images_own_list" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "school_crests_public_read" ON storage.objects;
CREATE POLICY "school_crests_platform_admin_list" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'school-crests' AND is_platform_admin());
