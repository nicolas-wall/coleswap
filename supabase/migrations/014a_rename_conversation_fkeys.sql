-- Renombre de las FK de conversations tras pasar de buyer/seller a family_a/family_b.
--
-- No es cosmético: PostgREST resuelve los embeds por NOMBRE de constraint, y el
-- código los pide literalmente en app/api/messages/route.ts y
-- app/api/messages/[id]/route.ts como:
--     families!conversations_family_a_id_fkey(...)
--     families!conversations_family_b_id_fkey(...)
-- En una base donde las constraints sigan llamándose buyer/seller, todo el
-- sistema de mensajes devuelve error.
--
-- Aplicada en producción el 2026-08-03 sin quedar versionada en el repo.
ALTER TABLE conversations RENAME CONSTRAINT conversations_buyer_id_fkey  TO conversations_family_a_id_fkey;
ALTER TABLE conversations RENAME CONSTRAINT conversations_seller_id_fkey TO conversations_family_b_id_fkey;
