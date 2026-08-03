-- ============================================================
-- Rate limiting genérico + límites de tamaño/tipo en storage y texto
-- ============================================================

CREATE TABLE rate_limit_hits (
  id bigserial PRIMARY KEY,
  bucket_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rate_limit_hits_key_idx ON rate_limit_hits(bucket_key, created_at);

-- Sin políticas: solo accesible a través de la función SECURITY DEFINER de abajo
ALTER TABLE rate_limit_hits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_rate_limit(p_key text, p_max_count int, p_window_seconds int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_count int;
BEGIN
  DELETE FROM rate_limit_hits
  WHERE bucket_key = p_key AND created_at < now() - (p_window_seconds || ' seconds')::interval;

  SELECT count(*) INTO current_count FROM rate_limit_hits WHERE bucket_key = p_key;

  IF current_count >= p_max_count THEN
    RETURN false;
  END IF;

  INSERT INTO rate_limit_hits (bucket_key) VALUES (p_key);
  RETURN true;
END;
$$;

-- ── Topes de longitud a nivel DB (ya existían en listings.notes y messages.body) ──
ALTER TABLE book_details ADD CONSTRAINT book_details_isbn_len CHECK (char_length(isbn) <= 20);
ALTER TABLE book_details ADD CONSTRAINT book_details_title_len CHECK (char_length(title) <= 200);
ALTER TABLE book_details ADD CONSTRAINT book_details_author_len CHECK (char_length(author) <= 150);
ALTER TABLE book_details ADD CONSTRAINT book_details_publisher_len CHECK (publisher IS NULL OR char_length(publisher) <= 150);
ALTER TABLE book_details ADD CONSTRAINT book_details_subject_len CHECK (char_length(subject) <= 100);
ALTER TABLE book_details ADD CONSTRAINT book_details_grade_len CHECK (char_length(grade) <= 50);

ALTER TABLE uniform_details ADD CONSTRAINT uniform_details_size_len CHECK (char_length(size) <= 20);
ALTER TABLE uniform_details ADD CONSTRAINT uniform_details_color_len CHECK (color IS NULL OR char_length(color) <= 30);

ALTER TABLE children ADD CONSTRAINT children_grade_len CHECK (char_length(grade) <= 50);
ALTER TABLE children ADD CONSTRAINT children_name_len CHECK (name IS NULL OR char_length(name) <= 60);

-- ── Storage: tope de tamaño y tipo de archivo permitido ──
UPDATE storage.buckets
SET file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id = 'listing-images';

UPDATE storage.buckets
SET file_size_limit = 2097152, allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id = 'school-crests';

-- ── Storage: tope de subidas por usuario, para que no se pueda saltear el límite
-- de la UI llamando a la API de Storage directamente ──
CREATE OR REPLACE FUNCTION enforce_storage_upload_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.bucket_id = 'listing-images' THEN
    IF NOT check_rate_limit('storage-upload:' || (storage.foldername(NEW.name))[1], 40, 3600) THEN
      RAISE EXCEPTION 'Demasiadas subidas. Esperá un rato y probá de nuevo.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER storage_objects_rate_limit
  BEFORE INSERT ON storage.objects
  FOR EACH ROW EXECUTE FUNCTION enforce_storage_upload_rate_limit();
