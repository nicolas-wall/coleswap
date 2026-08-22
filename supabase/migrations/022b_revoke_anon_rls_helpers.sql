-- Los helpers de RLS quedaban ejecutables por PUBLIC y anon, o sea por
-- cualquiera sin sesión. No filtran datos por sí solos, pero son superficie
-- innecesaria: se los reserva a authenticated, que es el único rol que los
-- necesita para que se evalúen las policies.
--
-- El re-GRANT a authenticated va en el mismo archivo a propósito: REVOKE ...
-- FROM PUBLIC también le saca el permiso heredado a authenticated, así que
-- separarlos dejaría la app vacía entre una migración y la otra.
--
-- Aplicada en producción el 2026-08-03 sin quedar versionada en el repo.
REVOKE EXECUTE ON FUNCTION get_my_school_id()                FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION is_school_admin()                 FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION is_platform_admin()               FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION is_conversation_participant(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION can_rate(uuid, rating_role, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION get_my_school_id()                TO authenticated;
GRANT EXECUTE ON FUNCTION is_school_admin()                 TO authenticated;
GRANT EXECUTE ON FUNCTION is_platform_admin()               TO authenticated;
GRANT EXECUTE ON FUNCTION is_conversation_participant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_rate(uuid, rating_role, uuid) TO authenticated;
