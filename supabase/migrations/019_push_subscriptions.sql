-- Notificaciones push del navegador para avisar de mensajes nuevos sin
-- tener que tener la app abierta.
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX push_subscriptions_family_idx ON push_subscriptions(family_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_own_select" ON push_subscriptions
  FOR SELECT USING (family_id = auth.uid());

CREATE POLICY "push_subscriptions_own_insert" ON push_subscriptions
  FOR INSERT WITH CHECK (family_id = auth.uid());

CREATE POLICY "push_subscriptions_own_delete" ON push_subscriptions
  FOR DELETE USING (family_id = auth.uid());

-- Necesaria para que el upsert (re-suscribirse) no choque contra la RLS,
-- como ya pasó antes con conversations/book_details
CREATE POLICY "push_subscriptions_own_update" ON push_subscriptions
  FOR UPDATE USING (family_id = auth.uid());
