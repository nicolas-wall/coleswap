-- Ya no hace falta pedir teléfono al registrarse: la coordinación pasa por
-- el chat interno, y quien quiera compartir su teléfono/redes lo hace ahí.
ALTER TABLE families ALTER COLUMN phone DROP NOT NULL;
