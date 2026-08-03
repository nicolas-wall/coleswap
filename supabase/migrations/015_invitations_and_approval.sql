-- ============================================================
-- Códigos multiuso con vencimiento (conviven con los de un solo uso)
-- + auto-registro con aprobación del moderador del colegio
-- ============================================================

ALTER TABLE invitations ADD COLUMN expires_at timestamptz;
ALTER TABLE invitations ADD COLUMN multi_use boolean NOT NULL DEFAULT false;
ALTER TABLE invitations ADD COLUMN created_by uuid REFERENCES families(id);

ALTER TABLE families ADD COLUMN approved boolean NOT NULL DEFAULT true;
ALTER TABLE families ADD COLUMN joined_via_code text;

-- Sin aprobar => sin acceso a nada scopeado por colegio (catálogo, listings, etc)
CREATE OR REPLACE FUNCTION get_my_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT school_id FROM families WHERE id = auth.uid() AND approved = true
$$;

-- Toda familia puede ver su propia fila aunque todavía no esté aprobada
-- (la necesita la pantalla de "esperando aprobación")
CREATE POLICY "families_select_own" ON families
  FOR SELECT USING (id = auth.uid());

-- Directorio público de colegios, para elegir colegio al pedir acceso sin código
CREATE POLICY "schools_public_directory" ON schools
  FOR SELECT USING (true);

-- La tabla invitations tenía RLS activado sin ninguna política (todo pasaba
-- por el service role); ahora los admins también la leen con el cliente normal
CREATE POLICY "invitations_select_school_admin" ON invitations
  FOR SELECT USING (is_school_admin() AND school_id = get_my_school_id());

CREATE POLICY "invitations_select_platform_admin" ON invitations
  FOR SELECT USING (is_platform_admin());
