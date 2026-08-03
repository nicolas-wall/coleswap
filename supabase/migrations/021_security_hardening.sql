-- ============================================================
-- Hardening: privacidad de contacto, integridad de ratings,
-- anti-escalación de privilegios y lockdown del rate limiter
-- ============================================================

-- ── 1) families: permisos a nivel de columna ─────────────────
-- El RLS controla filas, no columnas: cualquier familia del colegio podía
-- leer teléfono/email de todas las demás vía PostgREST, y peor, actualizar
-- su propia fila completa (role='school_admin', approved=true, suspended=false,
-- rating_avg inflado). Con grants por columna, la API solo permite leer datos
-- no sensibles y editar los cuatro campos del perfil; todo lo demás pasa por
-- el service role en el servidor.
REVOKE SELECT, INSERT, UPDATE, DELETE ON families FROM anon, authenticated;
GRANT SELECT (id, school_id, display_name, role, suspended, approved, rating_avg, rating_count, created_at)
  ON families TO authenticated;
GRANT UPDATE (display_name, phone, contact_email, contact_note)
  ON families TO authenticated;

-- ── 2) ratings: solo participantes reales de una venta concretada ──
-- La política vieja solo pedía rater = auth.uid(): cualquiera podía calificar
-- a cualquier familia con cualquier listing. SECURITY DEFINER para que la
-- verificación no dependa de qué filas de listings/contacts ve el calificador.
CREATE OR REPLACE FUNCTION can_rate(p_listing uuid, p_role rating_role, p_rated uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT CASE
    WHEN p_role = 'seller' THEN EXISTS (
      SELECT 1 FROM listings l
      JOIN contacts c ON c.listing_id = l.id
      WHERE l.id = p_listing AND l.family_id = auth.uid()
        AND l.status = 'sold' AND c.buyer_family_id = p_rated
    )
    WHEN p_role = 'buyer' THEN EXISTS (
      SELECT 1 FROM listings l
      JOIN contacts c ON c.listing_id = l.id
      WHERE l.id = p_listing AND l.family_id = p_rated
        AND l.status = 'sold' AND c.buyer_family_id = auth.uid()
    )
    ELSE false
  END
$$;

DROP POLICY "ratings_insert" ON ratings;
CREATE POLICY "ratings_insert" ON ratings
  FOR INSERT WITH CHECK (
    rater_family_id = auth.uid()
    AND can_rate(listing_id, role, rated_family_id)
  );

-- ── 3) rating_avg/rating_count por trigger ───────────────────
-- La acción de calificar intentaba actualizar la fila de la familia calificada
-- con el cliente del calificador: RLS lo filtraba en silencio y el promedio
-- nunca se actualizaba. Un trigger SECURITY DEFINER lo hace siempre, y además
-- los clientes ya no tienen UPDATE sobre esas columnas.
CREATE OR REPLACE FUNCTION refresh_family_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE families SET
    rating_avg = (SELECT round(avg(score)::numeric, 2) FROM ratings WHERE rated_family_id = NEW.rated_family_id),
    rating_count = (SELECT count(*) FROM ratings WHERE rated_family_id = NEW.rated_family_id)
  WHERE id = NEW.rated_family_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ratings_refresh_family
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION refresh_family_rating();

-- ── 4) listings: una publicación no puede cambiar de colegio ──
-- Sin WITH CHECK, el dueño podía editar school_id hacia otro colegio (el
-- directorio de colegios es público) y romper el aislamiento por comunidad.
DROP POLICY "listings_update_own" ON listings;
CREATE POLICY "listings_update_own" ON listings
  FOR UPDATE USING (family_id = auth.uid())
  WITH CHECK (family_id = auth.uid() AND school_id = get_my_school_id());

-- ── 5) check_rate_limit: solo invocable desde el servidor ────
-- Era ejecutable por cualquier cliente: se podía llenar el balde de otra
-- familia (p.ej. 'send-message:<uuid>') y bloquearle la mensajería. El
-- servidor ahora lo llama con el service role; el trigger de storage no se ve
-- afectado porque su función es SECURITY DEFINER.
REVOKE EXECUTE ON FUNCTION check_rate_limit(text, int, int) FROM PUBLIC, anon, authenticated;
