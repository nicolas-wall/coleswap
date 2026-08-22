-- Nuevo estado 'paused': la publicación sale del catálogo pero conserva fotos,
-- datos y conversaciones, y se reactiva con un toque. Es lo que permite bajar
-- algo sin perderlo, y lo que usa el auto-pausado por antigüedad.
--
-- Va solo en su propia migración a propósito: Postgres no deja usar un valor
-- de enum recién agregado en la misma transacción que lo agrega, así que
-- cualquier policy/función que mencione 'paused' tiene que ir en la siguiente.
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'paused';
