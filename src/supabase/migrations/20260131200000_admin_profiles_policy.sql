-- Migration to allow Admins to view and manage all users in the profiles table

-- 1. Enable Admins to SELECT all profiles
DROP POLICY IF EXISTS profiles_admin_all ON profiles;
CREATE POLICY profiles_admin_all ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  (auth.jwt() ->> 'email' = 'solomonidrissu@gmail.com')
);

-- Note: The logic above ensures both users with the 'admin' role in the DB 
-- AND Solomon (via email) can manage all profiles.
