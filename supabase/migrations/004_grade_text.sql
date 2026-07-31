ALTER TABLE book_details
  ALTER COLUMN grade TYPE text
  USING 'Primaria ' || grade || '°';
