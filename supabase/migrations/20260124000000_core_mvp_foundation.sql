-- Core MVP foundation (RUN FIRST)
-- Creates: profiles, creators, wallets, campaigns, creator_campaigns, wallet_ledger
-- Later migrations (001-004, 006-007) depend on these.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  account_type TEXT NOT NULL DEFAULT 'creator' CHECK (account_type IN ('creator', 'agency')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creators (
  creator_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID UNIQUE,
  display_name TEXT,
  niche TEXT,
  base_rate NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'NGN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'creators_wallet_fk') THEN
    ALTER TABLE creators ADD CONSTRAINT creators_wallet_fk
      FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  brand_logo_url TEXT,
  title TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  deliverable TEXT NOT NULL,
  compensation NUMERIC NOT NULL DEFAULT 0,
  timeline TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offered',
  rate NUMERIC NOT NULL DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  offer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(creator_id, campaign_id)
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('campaign_earning', 'withdrawal', 'adjustment')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  creator_campaign_id UUID REFERENCES creator_campaigns(id) ON DELETE SET NULL,
  reference TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE OR REPLACE VIEW wallet_balances AS
SELECT
  w.wallet_id,
  w.owner_id,
  w.currency,
  COALESCE(SUM(CASE WHEN l.type = 'campaign_earning' AND l.status = 'completed' THEN l.amount ELSE 0 END), 0) AS lifetime_earned,
  COALESCE(SUM(CASE WHEN l.type = 'withdrawal' AND l.status = 'completed' THEN l.amount ELSE 0 END), 0) AS lifetime_withdrawn,
  COALESCE(SUM(CASE WHEN l.type = 'campaign_earning' AND l.status = 'completed' THEN l.amount ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN l.type = 'withdrawal' AND l.status IN ('pending','completed') THEN l.amount ELSE 0 END), 0) AS available_balance,
  COALESCE(SUM(CASE WHEN l.type = 'campaign_earning' AND l.status = 'pending' THEN l.amount ELSE 0 END), 0) AS pending_earnings,
  COALESCE(SUM(CASE WHEN l.type = 'withdrawal' AND l.status = 'pending' THEN l.amount ELSE 0 END), 0) AS pending_withdrawals
FROM wallets w
LEFT JOIN wallet_ledger l ON l.wallet_id = w.wallet_id
GROUP BY w.wallet_id, w.owner_id, w.currency;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_creator_campaigns_creator ON creator_campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_campaigns_status ON creator_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet ON wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_status ON wallet_ledger(status);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_creator_campaign ON wallet_ledger(creator_campaign_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
CREATE TRIGGER update_creators_updated_at
BEFORE UPDATE ON creators
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_creator_campaigns_updated_at ON creator_campaigns;
CREATE TRIGGER update_creator_campaigns_updated_at
BEFORE UPDATE ON creator_campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_wallet_id UUID;
BEGIN
  INSERT INTO public.profiles (user_id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();

  INSERT INTO public.creators (creator_id, display_name, created_at, updated_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NOW(), NOW())
  ON CONFLICT (creator_id) DO NOTHING;

  SELECT wallet_id INTO new_wallet_id FROM public.wallets WHERE owner_id = NEW.id;
  IF new_wallet_id IS NULL THEN
    INSERT INTO public.wallets (owner_id, currency) VALUES (NEW.id, 'NGN') RETURNING wallet_id INTO new_wallet_id;
  END IF;

  UPDATE public.creators SET wallet_id = new_wallet_id WHERE creator_id = NEW.id AND wallet_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS creators_select_own ON creators;
CREATE POLICY creators_select_own ON creators
FOR SELECT USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS creators_update_own ON creators;
CREATE POLICY creators_update_own ON creators
FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS wallets_select_own ON wallets;
CREATE POLICY wallets_select_own ON wallets
FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS campaigns_select_all_authed ON campaigns;
CREATE POLICY campaigns_select_all_authed ON campaigns
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS creator_campaigns_select_own ON creator_campaigns;
CREATE POLICY creator_campaigns_select_own ON creator_campaigns
FOR SELECT USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS creator_campaigns_update_own ON creator_campaigns;
CREATE POLICY creator_campaigns_update_own ON creator_campaigns
FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS wallet_ledger_select_own ON wallet_ledger;
CREATE POLICY wallet_ledger_select_own ON wallet_ledger
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM wallets w
    WHERE w.wallet_id = wallet_ledger.wallet_id AND w.owner_id = auth.uid()
  )
);
