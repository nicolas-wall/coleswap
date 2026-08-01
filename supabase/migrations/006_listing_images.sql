ALTER TABLE listings ADD COLUMN images text[] NOT NULL DEFAULT '{}';
ALTER TABLE listings ADD CONSTRAINT listings_images_max4 CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 4);

INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "listing_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY "listing_images_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "listing_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
