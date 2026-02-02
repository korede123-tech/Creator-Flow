-- Robust Admin Policy to avoid recursion and ensure data visibility

-- 1. Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the old policy
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;

-- 3. Create the new policy using the function
CREATE POLICY profiles_admin_all ON public.profiles
FOR ALL TO authenticated
USING (
  (auth.jwt() ->> 'email' = 'solomonidrissu@gmail.com')
  OR
  (public.is_admin())
);

-- 4. Enable RLS on creators and wallets so admins can see them too
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS creators_admin_all ON public.creators;
CREATE POLICY creators_admin_all ON public.creators
FOR ALL TO authenticated
USING (
  (auth.jwt() ->> 'email' = 'solomonidrissu@gmail.com')
  OR
  (public.is_admin())
  OR
  (creator_id = auth.uid())
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallets_admin_all ON public.wallets;
CREATE POLICY wallets_admin_all ON public.wallets
FOR ALL TO authenticated
USING (
  (auth.jwt() ->> 'email' = 'solomonidrissu@gmail.com')
  OR
  (public.is_admin())
  OR
  (owner_id = auth.uid())
);
