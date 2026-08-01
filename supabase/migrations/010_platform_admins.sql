CREATE TABLE platform_admins (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE schools ADD COLUMN crest_url text;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
$$;

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_admins_self_select" ON platform_admins
  FOR SELECT USING (user_id = auth.uid());

-- Platform admins can manage all schools (create/update), not just view their own
CREATE POLICY "schools_admin_all" ON schools
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "schools_admin_insert" ON schools
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "schools_admin_update" ON schools
  FOR UPDATE USING (is_platform_admin());

-- Platform admins can view/update all families (to grant school_admin role)
CREATE POLICY "families_platform_admin_select" ON families
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "families_platform_admin_update" ON families
  FOR UPDATE USING (is_platform_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('school-crests', 'school-crests', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "school_crests_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'school-crests');

CREATE POLICY "school_crests_admin_write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'school-crests' AND is_platform_admin());

CREATE POLICY "school_crests_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'school-crests' AND is_platform_admin());
