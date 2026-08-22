-- ============================================================
-- Ciclo de vida de las publicaciones
--
-- Una publicación no envejece desde created_at sino desde renewed_at: la
-- última vez que el dueño confirmó que sigue disponible (o la reactivó).
--   día 45 → le preguntamos "¿sigue disponible?" (push + banner in-app)
--   día 60 → si no contestó, se pausa sola y sale del catálogo
-- El dueño la reactiva desde "Mis publicaciones" y el reloj vuelve a cero.
-- ============================================================

-- Última confirmación de disponibilidad. Las que ya existen arrancan con su
-- fecha de creación, así el primer barrido las trata según su edad real.
ALTER TABLE listings ADD COLUMN renewed_at timestamptz;
UPDATE listings SET renewed_at = created_at WHERE renewed_at IS NULL;
ALTER TABLE listings ALTER COLUMN renewed_at SET DEFAULT now();
ALTER TABLE listings ALTER COLUMN renewed_at SET NOT NULL;

-- Cuándo se le preguntó por última vez. Se limpia al confirmar/reactivar, así
-- el cron no vuelve a avisar por algo que el dueño ya respondió.
ALTER TABLE listings ADD COLUMN nudged_at timestamptz;

-- Distingue la pausa manual de la automática, para poder explicarle al dueño
-- por qué su publicación no está en el catálogo.
ALTER TABLE listings ADD COLUMN paused_at timestamptz;
ALTER TABLE listings ADD COLUMN paused_reason text
  CHECK (paused_reason IN ('manual', 'expired'));

-- El cron barre solo publicaciones activas ordenadas por antigüedad.
CREATE INDEX listings_lifecycle_idx ON listings(renewed_at)
  WHERE status = 'active';

-- Las pausadas quedan fuera del catálogo sin tocar nada: la policy de catálogo
-- ya exige status = 'active', y "listings_own" le sigue mostrando al dueño sus
-- publicaciones en todos los estados.
