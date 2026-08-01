ALTER TABLE families ADD COLUMN social_handle text;
ALTER TABLE families ADD COLUMN contact_note text CHECK (char_length(contact_note) <= 280);
