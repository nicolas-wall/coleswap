-- Faltaba UPDATE en book_details/uniform_details: solo había SELECT e INSERT,
-- así que nunca se pudo editar una publicación ya creada.
CREATE POLICY "book_details_update" ON book_details
  FOR UPDATE USING (
    listing_id IN (SELECT id FROM listings WHERE family_id = auth.uid())
  );

CREATE POLICY "uniform_details_update" ON uniform_details
  FOR UPDATE USING (
    listing_id IN (SELECT id FROM listings WHERE family_id = auth.uid())
  );
