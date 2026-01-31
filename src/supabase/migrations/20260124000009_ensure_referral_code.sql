-- Ensure every profile has a referral code (backfill + RPC for runtime fix).

-- 1. Backfill: set referral_code for any profile with NULL or empty
UPDATE profiles
SET referral_code = public.generate_referral_code(user_id),
    updated_at = NOW()
WHERE referral_code IS NULL OR TRIM(referral_code) = '';

-- 2. RPC: ensure current user's profile has a code; fix if missing, return it.
CREATE OR REPLACE FUNCTION public.ensure_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
BEGIN
  UPDATE profiles
  SET referral_code = COALESCE(NULLIF(TRIM(referral_code), ''), public.generate_referral_code(user_id)),
      updated_at = NOW()
  WHERE user_id = auth.uid()
  RETURNING referral_code INTO code;
  RETURN code;
END;
$$;

-- Allow authenticated users to call it
GRANT EXECUTE ON FUNCTION public.ensure_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_referral_code() TO service_role;
