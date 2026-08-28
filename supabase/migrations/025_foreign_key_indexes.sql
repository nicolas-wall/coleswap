-- Índices de cobertura para las foreign keys que no tenían ninguno.
--
-- Sin índice, resolver una FK obliga a Postgres a recorrer la tabla entera.
-- Con la base recién vaciada no se nota; con varios cientos de publicaciones y
-- mensajes sí, y agregarlos ahora es gratis porque no hay nada que reconstruir.
--
-- Todos son sobre columnas que la app filtra de verdad: el catálogo del colegio
-- (families.school_id), las conversaciones de una publicación, quién mandó cada
-- mensaje y las calificaciones de una familia.

create index if not exists contacts_buyer_family_id_idx
  on contacts (buyer_family_id);

create index if not exists conversation_reads_family_id_idx
  on conversation_reads (family_id);

create index if not exists conversations_listing_id_idx
  on conversations (listing_id);

create index if not exists families_school_id_idx
  on families (school_id);

create index if not exists invitations_created_by_idx
  on invitations (created_by);

create index if not exists invitations_school_id_idx
  on invitations (school_id);

create index if not exists messages_sender_id_idx
  on messages (sender_id);

create index if not exists ratings_rated_family_id_idx
  on ratings (rated_family_id);

create index if not exists ratings_rater_family_id_idx
  on ratings (rater_family_id);
