-- El campo "red social / usuario" pasa a ser un email alternativo de
-- contacto opcional (además del email de login).
ALTER TABLE families RENAME COLUMN social_handle TO contact_email;
