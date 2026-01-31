-- Migration to fix profiles sync during signup
-- Use this if registration data (full_name, phone, etc) is not appearing in the profiles table.

-- 1. Update the handle_new_user trigger to extract more metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_wallet_id UUID;
BEGIN
  -- Insert/Update Profile with metadata from Signup
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    phone, 
    account_type, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'creator'),
    NOW(), 
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    account_type = COALESCE(EXCLUDED.account_type, public.profiles.account_type),
    updated_at = NOW();

  -- Sync with creators table
  INSERT INTO public.creators (creator_id, display_name, created_at, updated_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NOW(), NOW())
  ON CONFLICT (creator_id) DO NOTHING;

  -- Create wallet if missing
  SELECT wallet_id INTO new_wallet_id FROM public.wallets WHERE owner_id = NEW.id;
  IF new_wallet_id IS NULL THEN
    INSERT INTO public.wallets (owner_id, currency) VALUES (NEW.id, 'NGN') RETURNING wallet_id INTO new_wallet_id;
  END IF;

  UPDATE public.creators SET wallet_id = new_wallet_id WHERE creator_id = NEW.id AND wallet_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure RLS allows the system to manage profiles
-- (The trigger runs with SECURITY DEFINER so it ignores RLS, but for client-side code we need this)
DROP POLICY IF EXISTS profiles_insert_system ON profiles;
CREATE POLICY profiles_insert_system ON profiles
FOR INSERT WITH CHECK (true); -- Allow system/metadata inserts
