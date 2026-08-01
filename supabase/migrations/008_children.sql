CREATE TABLE children (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name       text,
  grade      text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX children_family_idx ON children(family_id);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "children_own" ON children
  FOR SELECT USING (family_id = auth.uid());

CREATE POLICY "children_insert_own" ON children
  FOR INSERT WITH CHECK (family_id = auth.uid());

CREATE POLICY "children_update_own" ON children
  FOR UPDATE USING (family_id = auth.uid());

CREATE POLICY "children_delete_own" ON children
  FOR DELETE USING (family_id = auth.uid());
