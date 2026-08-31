-- Rendimiento de las policies de RLS. Dos cambios, ningún cambio de permisos.
--
-- 1. `auth.uid()` y los helpers (`get_my_school_id`, `is_school_admin`,
--    `is_platform_admin`) se evaluaban UNA VEZ POR FILA. Envueltos en
--    `(select ...)` Postgres los resuelve como InitPlan: una sola vez por
--    consulta. Los helpers son los que más pesan porque cada uno hace su
--    propia query.
--
--    `is_conversation_participant(conversation_id)` y `can_rate(...)` NO se
--    envuelven: reciben columnas de la fila, así que dependen de cada fila y
--    un InitPlan daría un resultado incorrecto.
--
-- 2. Donde había varias policies PERMISSIVE para la misma tabla y la misma
--    acción, Postgres las evaluaba todas y unía los resultados con OR. Se
--    fusionan en una sola con el mismo OR escrito a mano. El resultado visible
--    es idéntico; lo que cambia es que se recorre una expresión en vez de tres.
--
-- Donde una policy no declaraba WITH CHECK, Postgres usaba su USING también
-- para validar las filas nuevas. Acá ese WITH CHECK implícito se escribe
-- explícito: es la misma regla, pero deja de depender de un default.

-- ---------------------------------------------------------------- book_details

drop policy if exists book_details_select on book_details;
create policy book_details_select on book_details for select
  using (
    listing_id in (
      select listings.id from listings
      where listings.school_id = (select get_my_school_id())
        and (listings.status = 'active'::listing_status
             or listings.family_id = (select auth.uid()))
    )
  );

drop policy if exists book_details_insert on book_details;
create policy book_details_insert on book_details for insert
  with check (
    listing_id in (select listings.id from listings
                   where listings.family_id = (select auth.uid()))
  );

drop policy if exists book_details_update on book_details;
create policy book_details_update on book_details for update
  using (
    listing_id in (select listings.id from listings
                   where listings.family_id = (select auth.uid()))
  )
  with check (
    listing_id in (select listings.id from listings
                   where listings.family_id = (select auth.uid()))
  );

-- ------------------------------------------------------------- uniform_details

drop policy if exists uniform_details_select on uniform_details;
create policy uniform_details_select on uniform_details for select
  using (
    listing_id in (
      select listings.id from listings
      where listings.school_id = (select get_my_school_id())
        and (listings.status = 'active'::listing_status
             or listings.family_id = (select auth.uid()))
    )
  );

drop policy if exists uniform_details_insert on uniform_details;
create policy uniform_details_insert on uniform_details for insert
  with check (
    listing_id in (select listings.id from listings
                   where listings.family_id = (select auth.uid()))
  );

drop policy if exists uniform_details_update on uniform_details;
create policy uniform_details_update on uniform_details for update
  using (
    listing_id in (select listings.id from listings
                   where listings.family_id = (select auth.uid()))
  )
  with check (
    listing_id in (select listings.id from listings
                   where listings.family_id = (select auth.uid()))
  );

-- -------------------------------------------------------------------- children

drop policy if exists children_own on children;
create policy children_own on children for select
  using (family_id = (select auth.uid()));

drop policy if exists children_insert_own on children;
create policy children_insert_own on children for insert
  with check (family_id = (select auth.uid()));

drop policy if exists children_update_own on children;
create policy children_update_own on children for update
  using (family_id = (select auth.uid()))
  with check (family_id = (select auth.uid()));

drop policy if exists children_delete_own on children;
create policy children_delete_own on children for delete
  using (family_id = (select auth.uid()));

-- -------------------------------------------------------------------- contacts

drop policy if exists contacts_select on contacts;
create policy contacts_select on contacts for select
  using (
    buyer_family_id = (select auth.uid())
    or listing_id in (select listings.id from listings
                      where listings.family_id = (select auth.uid()))
  );

drop policy if exists contacts_insert on contacts;
create policy contacts_insert on contacts for insert
  with check (
    buyer_family_id = (select auth.uid())
    and listing_id in (
      select listings.id from listings
      where listings.school_id = (select get_my_school_id())
        and listings.status = 'active'::listing_status
        and listings.family_id <> (select auth.uid())
    )
  );

-- ----------------------------------------------------------- conversation_reads

drop policy if exists conversation_reads_select on conversation_reads;
create policy conversation_reads_select on conversation_reads for select
  using (family_id = (select auth.uid()));

drop policy if exists conversation_reads_upsert on conversation_reads;
create policy conversation_reads_upsert on conversation_reads for insert
  with check (
    family_id = (select auth.uid())
    and is_conversation_participant(conversation_id)
  );

drop policy if exists conversation_reads_update on conversation_reads;
create policy conversation_reads_update on conversation_reads for update
  using (family_id = (select auth.uid()))
  with check (family_id = (select auth.uid()));

-- --------------------------------------------------------------- conversations

drop policy if exists conversations_select on conversations;
create policy conversations_select on conversations for select
  using (
    family_a_id = (select auth.uid())
    or family_b_id = (select auth.uid())
  );

drop policy if exists conversations_insert on conversations;
create policy conversations_insert on conversations for insert
  with check (
    (family_a_id = (select auth.uid()) or family_b_id = (select auth.uid()))
    and family_a_id <> family_b_id
    and family_a_id in (select families.id from families
                        where families.school_id = (select get_my_school_id()))
    and family_b_id in (select families.id from families
                        where families.school_id = (select get_my_school_id()))
  );

-- -------------------------------------------------------------------- messages

drop policy if exists messages_select on messages;
create policy messages_select on messages for select
  using (is_conversation_participant(conversation_id));

drop policy if exists messages_insert on messages;
create policy messages_insert on messages for insert
  with check (
    sender_id = (select auth.uid())
    and is_conversation_participant(conversation_id)
  );

-- ------------------------------------------------------------- platform_admins

drop policy if exists platform_admins_self_select on platform_admins;
create policy platform_admins_self_select on platform_admins for select
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------- push_subscriptions

drop policy if exists push_subscriptions_own_select on push_subscriptions;
create policy push_subscriptions_own_select on push_subscriptions for select
  using (family_id = (select auth.uid()));

drop policy if exists push_subscriptions_own_insert on push_subscriptions;
create policy push_subscriptions_own_insert on push_subscriptions for insert
  with check (family_id = (select auth.uid()));

drop policy if exists push_subscriptions_own_update on push_subscriptions;
create policy push_subscriptions_own_update on push_subscriptions for update
  using (family_id = (select auth.uid()))
  with check (family_id = (select auth.uid()));

drop policy if exists push_subscriptions_own_delete on push_subscriptions;
create policy push_subscriptions_own_delete on push_subscriptions for delete
  using (family_id = (select auth.uid()));

-- --------------------------------------------------------------------- ratings

drop policy if exists ratings_select on ratings;
create policy ratings_select on ratings for select
  using (
    rated_family_id in (select families.id from families
                        where families.school_id = (select get_my_school_id()))
  );

drop policy if exists ratings_insert on ratings;
create policy ratings_insert on ratings for insert
  with check (
    rater_family_id = (select auth.uid())
    and can_rate(listing_id, role, rated_family_id)
  );

-- --------------------------------------------------------------------- schools
-- Tres policies de SELECT: `schools_public_directory` con USING (true),
-- `schools_own` y `schools_admin_all`. Como se unen con OR y una ya es `true`,
-- las otras dos nunca cambiaban el resultado. Queda sólo el directorio.
--
-- El directorio es público a propósito: en el alta la familia elige su colegio
-- de una lista y todavía no tiene sesión. Además, al no llamar a ningún helper,
-- deja de importar que `anon` no tenga permiso de ejecutarlos.

drop policy if exists schools_own on schools;
drop policy if exists schools_admin_all on schools;
drop policy if exists schools_public_directory on schools;
create policy schools_public_directory on schools for select
  using (true);

drop policy if exists schools_admin_insert on schools;
create policy schools_admin_insert on schools for insert
  with check ((select is_platform_admin()));

drop policy if exists schools_admin_update on schools;
create policy schools_admin_update on schools for update
  using ((select is_platform_admin()))
  with check ((select is_platform_admin()));

-- -------------------------------------------------------------------- families
-- SELECT: tu propia fila, el resto de tu colegio, o todo si sos admin de
-- plataforma. UPDATE: lo mismo. Qué columnas puede tocar cada uno lo sigue
-- decidiendo el GRANT por columna, no esta policy: `authenticated` sólo tiene
-- UPDATE sobre display_name, phone, contact_email y contact_note, así que
-- nadie puede autoaprobarse ni cambiarse de colegio.

drop policy if exists families_select_own on families;
drop policy if exists families_own_school on families;
drop policy if exists families_platform_admin_select on families;
create policy families_select on families for select
  using (
    id = (select auth.uid())
    or school_id = (select get_my_school_id())
    or (select is_platform_admin())
  );

drop policy if exists families_update_own on families;
drop policy if exists families_update_admin on families;
drop policy if exists families_platform_admin_update on families;
create policy families_update on families for update
  using (
    id = (select auth.uid())
    or ((select is_school_admin()) and school_id = (select get_my_school_id()))
    or (select is_platform_admin())
  )
  with check (
    id = (select auth.uid())
    or ((select is_school_admin()) and school_id = (select get_my_school_id()))
    or (select is_platform_admin())
  );

-- ----------------------------------------------------------------- invitations

drop policy if exists invitations_select_school_admin on invitations;
drop policy if exists invitations_select_platform_admin on invitations;
create policy invitations_select on invitations for select
  using (
    ((select is_school_admin()) and school_id = (select get_my_school_id()))
    or (select is_platform_admin())
  );

-- -------------------------------------------------------------------- listings
-- SELECT unía tres policies: las propias en cualquier estado, las activas del
-- colegio, y todas las del colegio si sos admin. La condición
-- `family_id <> auth.uid()` que traía la de activas era redundante: esas filas
-- ya entran por la rama de "las propias".
--
-- El WITH CHECK de UPDATE es la parte sensible. Sin la mitad
-- `school_id = get_my_school_id()` una familia podría mover su publicación al
-- catálogo de otro colegio. Eso se arregló en 021 y se conserva textual acá.

drop policy if exists listings_own on listings;
drop policy if exists listings_active_own_school on listings;
drop policy if exists listings_admin_all on listings;
create policy listings_select on listings for select
  using (
    family_id = (select auth.uid())
    or (school_id = (select get_my_school_id())
        and status = 'active'::listing_status)
    or ((select is_school_admin()) and school_id = (select get_my_school_id()))
  );

drop policy if exists listings_insert on listings;
create policy listings_insert on listings for insert
  with check (
    family_id = (select auth.uid())
    and school_id = (select get_my_school_id())
  );

drop policy if exists listings_update_own on listings;
drop policy if exists listings_update_admin on listings;
create policy listings_update on listings for update
  using (
    family_id = (select auth.uid())
    or ((select is_school_admin()) and school_id = (select get_my_school_id()))
  )
  with check (
    (family_id = (select auth.uid())
     and school_id = (select get_my_school_id()))
    or ((select is_school_admin()) and school_id = (select get_my_school_id()))
  );
