CREATE TYPE family_role AS ENUM ('user', 'school_admin');

ALTER TABLE families ADD COLUMN role family_role NOT NULL DEFAULT 'user';
ALTER TABLE families ADD COLUMN suspended boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION is_school_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT role = 'school_admin' FROM families WHERE id = auth.uid()), false)
$$;

-- School admins can update any family in their own school (suspend/unsuspend)
CREATE POLICY "families_update_admin" ON families
  FOR UPDATE USING (
    is_school_admin() AND school_id = get_my_school_id()
  );

-- School admins can see every listing in their school regardless of status
CREATE POLICY "listings_admin_all" ON listings
  FOR SELECT USING (
    is_school_admin() AND school_id = get_my_school_id()
  );

-- School admins can update (e.g. remove) any listing in their school
CREATE POLICY "listings_update_admin" ON listings
  FOR UPDATE USING (
    is_school_admin() AND school_id = get_my_school_id()
  );
