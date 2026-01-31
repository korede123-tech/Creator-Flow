-- Referrals system (MVP)

-- Add referral fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code_unique ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Each referral event (for audit/history)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referrer_user_id, referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);

-- Helper to generate a short referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  -- 10 chars from md5
  RETURN upper(substr(md5(user_id::text), 1, 10));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ensure referral_code exists for existing profiles
UPDATE profiles
SET referral_code = public.generate_referral_code(user_id)
WHERE referral_code IS NULL;

-- Ensure new users get referral_code too (extend handle_new_user)
-- Re-create function so it stays idempotent
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_wallet_id UUID;
BEGIN
  INSERT INTO public.profiles (user_id, email, referral_code, created_at, updated_at)
  VALUES (NEW.id, NEW.email, public.generate_referral_code(NEW.id), NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    referral_code = COALESCE(public.profiles.referral_code, EXCLUDED.referral_code),
    updated_at = NOW();

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

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referrals_select_own ON referrals;
CREATE POLICY referrals_select_own ON referrals
FOR SELECT USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);
