-- Las expresiones de una política RLS se evalúan con los privilegios del usuario
-- que consulta: sin EXECUTE, la política falla y la tabla queda vacía.
--
-- Este es el más peligroso de los que faltaban en el repo, porque no rompe con
-- error sino en silencio: la app levanta bien y se ve completamente vacía
-- —catálogo sin publicaciones, sin mensajes, sin nada— sin una sola excepción
-- en los logs que apunte a la causa.
--
-- Aplicada en producción el 2026-08-03 sin quedar versionada en el repo.
GRANT EXECUTE ON FUNCTION get_my_school_id()                TO authenticated;
GRANT EXECUTE ON FUNCTION is_school_admin()                 TO authenticated;
GRANT EXECUTE ON FUNCTION is_platform_admin()               TO authenticated;
GRANT EXECUTE ON FUNCTION is_conversation_participant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_rate(uuid, rating_role, uuid) TO authenticated;
