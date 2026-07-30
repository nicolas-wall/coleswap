-- ============================================================
-- SchoolShop: Row Level Security
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE schools         ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE families        ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_details    ENABLE ROW LEVEL SECURITY;
ALTER TABLE uniform_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings         ENABLE ROW LEVEL SECURITY;

-- Helper: devuelve el school_id del usuario autenticado.
-- STABLE + SECURITY DEFINER = PostgreSQL puede cachear por statement y
-- evita que el usuario vea las familias de otros colegios.
CREATE OR REPLACE FUNCTION get_my_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT school_id FROM families WHERE id = auth.uid()
$$;

-- ── Schools ──────────────────────────────────────────────────
-- Solo ver tu propio colegio
CREATE POLICY "schools_own" ON schools
  FOR SELECT USING (id = get_my_school_id());

-- ── Families ─────────────────────────────────────────────────
-- Ver familias del mismo colegio
CREATE POLICY "families_own_school" ON families
  FOR SELECT USING (school_id = get_my_school_id());

-- Cada familia solo edita su propio registro
CREATE POLICY "families_update_own" ON families
  FOR UPDATE USING (id = auth.uid());

-- INSERT lo maneja la service role en el signup (no desde el cliente)

-- ── Listings ─────────────────────────────────────────────────
-- Publicaciones activas del mismo colegio (catálogo público del colegio)
CREATE POLICY "listings_active_own_school" ON listings
  FOR SELECT USING (
    school_id = get_my_school_id()
    AND status = 'active'
    AND family_id != auth.uid()   -- no ver las propias en el catálogo general
  );

-- Las propias publicaciones (todos los estados) para /my-listings
CREATE POLICY "listings_own" ON listings
  FOR SELECT USING (family_id = auth.uid());

-- Solo el dueño puede insertar (school_id debe coincidir)
CREATE POLICY "listings_insert" ON listings
  FOR INSERT WITH CHECK (
    family_id = auth.uid()
    AND school_id = get_my_school_id()
  );

-- Solo el dueño puede actualizar (marcar vendido, editar)
CREATE POLICY "listings_update_own" ON listings
  FOR UPDATE USING (family_id = auth.uid());

-- ── Book / Uniform details ───────────────────────────────────
-- Visibles si el listing padre es visible
CREATE POLICY "book_details_select" ON book_details
  FOR SELECT USING (
    listing_id IN (
      SELECT id FROM listings
      WHERE school_id = get_my_school_id()
        AND (status = 'active' OR family_id = auth.uid())
    )
  );

CREATE POLICY "book_details_insert" ON book_details
  FOR INSERT WITH CHECK (
    listing_id IN (SELECT id FROM listings WHERE family_id = auth.uid())
  );

CREATE POLICY "uniform_details_select" ON uniform_details
  FOR SELECT USING (
    listing_id IN (
      SELECT id FROM listings
      WHERE school_id = get_my_school_id()
        AND (status = 'active' OR family_id = auth.uid())
    )
  );

CREATE POLICY "uniform_details_insert" ON uniform_details
  FOR INSERT WITH CHECK (
    listing_id IN (SELECT id FROM listings WHERE family_id = auth.uid())
  );

-- ── Contacts ─────────────────────────────────────────────────
-- El comprador ve sus propios contactos; el vendedor ve los contactos de sus listings
CREATE POLICY "contacts_select" ON contacts
  FOR SELECT USING (
    buyer_family_id = auth.uid()
    OR listing_id IN (SELECT id FROM listings WHERE family_id = auth.uid())
  );

-- Solo crear contacto de un listing activo de otro usuario del mismo colegio
CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT WITH CHECK (
    buyer_family_id = auth.uid()
    AND listing_id IN (
      SELECT id FROM listings
      WHERE school_id = get_my_school_id()
        AND status = 'active'
        AND family_id != auth.uid()
    )
  );

-- ── Ratings ──────────────────────────────────────────────────
-- Ver calificaciones de familias del mismo colegio
CREATE POLICY "ratings_select" ON ratings
  FOR SELECT USING (
    rated_family_id IN (
      SELECT id FROM families WHERE school_id = get_my_school_id()
    )
  );

-- Solo el calificador puede insertar su propia calificación
CREATE POLICY "ratings_insert" ON ratings
  FOR INSERT WITH CHECK (rater_family_id = auth.uid());
