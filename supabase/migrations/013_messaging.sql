-- ============================================================
-- SchoolShop: Mensajería entre familias
-- ============================================================

-- Una conversación por (listing, comprador) — el vendedor es el dueño del listing
CREATE TABLE conversations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       uuid NOT NULL REFERENCES listings(id),
  buyer_id         uuid NOT NULL REFERENCES families(id),
  seller_id        uuid NOT NULL REFERENCES families(id),
  created_at       timestamptz DEFAULT now(),
  last_message_at  timestamptz DEFAULT now(),
  UNIQUE(listing_id, buyer_id)
);

CREATE TABLE messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES families(id),
  body            text NOT NULL CHECK (char_length(btrim(body)) > 0 AND char_length(body) <= 1000),
  created_at      timestamptz DEFAULT now()
);

-- Puntero de "última vez leído" por participante (evita permisos a nivel de columna)
CREATE TABLE conversation_reads (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  family_id       uuid NOT NULL REFERENCES families(id),
  last_read_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, family_id)
);

CREATE INDEX conversations_buyer_idx ON conversations(buyer_id);
CREATE INDEX conversations_seller_idx ON conversations(seller_id);
CREATE INDEX messages_conversation_idx ON messages(conversation_id, created_at);

-- Mantiene conversations.last_message_at al día sin dar UPDATE directo a los clientes
CREATE OR REPLACE FUNCTION touch_conversation_last_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_touch_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION touch_conversation_last_message();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_reads ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conv_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
$$;

CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Solo el comprador inicia una conversación, sobre un listing activo de otra familia del colegio
CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (
    buyer_id = auth.uid()
    AND seller_id = (SELECT family_id FROM listings WHERE id = listing_id)
    AND listing_id IN (
      SELECT id FROM listings
      WHERE school_id = get_my_school_id()
        AND status = 'active'
        AND family_id != auth.uid()
    )
  );

CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (is_conversation_participant(conversation_id));

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND is_conversation_participant(conversation_id)
  );

CREATE POLICY "conversation_reads_select" ON conversation_reads
  FOR SELECT USING (family_id = auth.uid());

CREATE POLICY "conversation_reads_upsert" ON conversation_reads
  FOR INSERT WITH CHECK (family_id = auth.uid() AND is_conversation_participant(conversation_id));

CREATE POLICY "conversation_reads_update" ON conversation_reads
  FOR UPDATE USING (family_id = auth.uid());

-- Realtime para el chat en vivo y para que el badge de no leídos se actualice al instante
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_reads;
