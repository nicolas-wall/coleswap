-- ============================================================
-- Un solo hilo de mensajes por par de familias, no por publicación
-- ============================================================

ALTER TABLE conversations RENAME COLUMN buyer_id TO family_a_id;
ALTER TABLE conversations RENAME COLUMN seller_id TO family_b_id;

-- Orden canónico del par (evita duplicar el hilo según quién escribe primero)
UPDATE conversations
SET family_a_id = CASE WHEN family_a_id < family_b_id THEN family_a_id ELSE family_b_id END,
    family_b_id = CASE WHEN family_a_id < family_b_id THEN family_b_id ELSE family_a_id END;

-- Fusionar conversaciones duplicadas del mismo par de familias en la más antigua
WITH ranked AS (
  SELECT id, family_a_id, family_b_id,
         ROW_NUMBER() OVER (PARTITION BY family_a_id, family_b_id ORDER BY created_at ASC) AS rn
  FROM conversations
),
canon AS (
  SELECT r1.id AS dup_id, r2.id AS keep_id
  FROM ranked r1
  JOIN ranked r2 ON r1.family_a_id = r2.family_a_id AND r1.family_b_id = r2.family_b_id AND r2.rn = 1
  WHERE r1.rn > 1
)
UPDATE messages m SET conversation_id = c.keep_id
FROM canon c WHERE m.conversation_id = c.dup_id;

WITH ranked AS (
  SELECT id, family_a_id, family_b_id,
         ROW_NUMBER() OVER (PARTITION BY family_a_id, family_b_id ORDER BY created_at ASC) AS rn
  FROM conversations
),
canon AS (
  SELECT r1.id AS dup_id, r2.id AS keep_id
  FROM ranked r1
  JOIN ranked r2 ON r1.family_a_id = r2.family_a_id AND r1.family_b_id = r2.family_b_id AND r2.rn = 1
  WHERE r1.rn > 1
)
DELETE FROM conversation_reads cr
USING canon c
WHERE cr.conversation_id = c.dup_id
  AND EXISTS (SELECT 1 FROM conversation_reads cr2 WHERE cr2.conversation_id = c.keep_id AND cr2.family_id = cr.family_id);

WITH ranked AS (
  SELECT id, family_a_id, family_b_id,
         ROW_NUMBER() OVER (PARTITION BY family_a_id, family_b_id ORDER BY created_at ASC) AS rn
  FROM conversations
),
canon AS (
  SELECT r1.id AS dup_id, r2.id AS keep_id
  FROM ranked r1
  JOIN ranked r2 ON r1.family_a_id = r2.family_a_id AND r1.family_b_id = r2.family_b_id AND r2.rn = 1
  WHERE r1.rn > 1
)
UPDATE conversation_reads cr SET conversation_id = c.keep_id
FROM canon c WHERE cr.conversation_id = c.dup_id;

WITH ranked AS (
  SELECT id, family_a_id, family_b_id,
         ROW_NUMBER() OVER (PARTITION BY family_a_id, family_b_id ORDER BY created_at ASC) AS rn
  FROM conversations
)
DELETE FROM conversations WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- La conversación ya no depende de una publicación puntual
ALTER TABLE conversations ALTER COLUMN listing_id DROP NOT NULL;
ALTER TABLE conversations DROP CONSTRAINT conversations_listing_id_buyer_id_key;
ALTER TABLE conversations ADD CONSTRAINT conversations_family_pair_key UNIQUE (family_a_id, family_b_id);
ALTER TABLE conversations ADD CONSTRAINT conversations_family_order_check CHECK (family_a_id < family_b_id);

-- Helper de RLS actualizado a los nuevos nombres de columna
CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conv_id AND (family_a_id = auth.uid() OR family_b_id = auth.uid())
  )
$$;

DROP POLICY "conversations_select" ON conversations;
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (family_a_id = auth.uid() OR family_b_id = auth.uid());

DROP POLICY "conversations_insert" ON conversations;
CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (
    (family_a_id = auth.uid() OR family_b_id = auth.uid())
    AND family_a_id <> family_b_id
    AND family_a_id IN (SELECT id FROM families WHERE school_id = get_my_school_id())
    AND family_b_id IN (SELECT id FROM families WHERE school_id = get_my_school_id())
  );

-- RENAME COLUMN no renombra las FKs; alinear nombres para que no queden crípticos
ALTER TABLE conversations RENAME CONSTRAINT conversations_buyer_id_fkey TO conversations_family_a_id_fkey;
ALTER TABLE conversations RENAME CONSTRAINT conversations_seller_id_fkey TO conversations_family_b_id_fkey;
