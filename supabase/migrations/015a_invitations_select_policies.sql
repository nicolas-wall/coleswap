-- Faltaban las policies de SELECT sobre invitations: el admin de colegio y el
-- de plataforma podían crear códigos pero no listarlos, así que el panel de
-- administración se veía vacío.
--
-- Aplicada en producción el 2026-08-03 sin quedar versionada en el repo.
CREATE POLICY "invitations_select_school_admin" ON invitations
  FOR SELECT USING (is_school_admin() AND school_id = get_my_school_id());

CREATE POLICY "invitations_select_platform_admin" ON invitations
  FOR SELECT USING (is_platform_admin());
