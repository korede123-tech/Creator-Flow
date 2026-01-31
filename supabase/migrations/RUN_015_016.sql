-- Run 015 first (creator profile module), then 016 (SMM packages).
-- Paste this entire file into Supabase Dashboard → SQL Editor → New query → Run.

-- ========== 015: Creator Profile module ==========
-- Creator Profile module: identity + pricing for brands.
-- Tables: creator_profiles, creator_social_accounts, creator_packages.

-- 1. creator_profiles (one per user)
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  location TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  niches TEXT[] NOT NULL DEFAULT '{}',
  audience_region TEXT NOT NULL,
  gender TEXT,
  languages TEXT[] NOT NULL DEFAULT '{English}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_profiles_user ON creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_status ON creator_profiles(status);

DROP TRIGGER IF EXISTS update_creator_profiles_updated_at ON creator_profiles;
CREATE TRIGGER update_creator_profiles_updated_at
BEFORE UPDATE ON creator_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. creator_social_accounts (one row per platform per creator)
CREATE TABLE IF NOT EXISTS creator_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'twitter', 'website')),
  handle TEXT NOT NULL,
  follower_range TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_creator_social_creator ON creator_social_accounts(creator_id);

DROP TRIGGER IF EXISTS update_creator_social_accounts_updated_at ON creator_social_accounts;
CREATE TRIGGER update_creator_social_accounts_updated_at
BEFORE UPDATE ON creator_social_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. creator_packages
CREATE TABLE IF NOT EXISTS creator_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  duration_value NUMERIC NOT NULL,
  duration_unit TEXT NOT NULL CHECK (duration_unit IN ('seconds', 'minutes')),
  price NUMERIC NOT NULL,
  turnaround_time TEXT NOT NULL,
  revisions INT NOT NULL DEFAULT 0,
  includes_posting BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_packages_creator ON creator_packages(creator_id);

-- 4. RLS
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS creator_profiles_select_own ON creator_profiles;
CREATE POLICY creator_profiles_select_own ON creator_profiles
FOR SELECT USING (auth.uid() = user_id OR (status = 'live'));

DROP POLICY IF EXISTS creator_profiles_insert_own ON creator_profiles;
CREATE POLICY creator_profiles_insert_own ON creator_profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS creator_profiles_update_own ON creator_profiles;
CREATE POLICY creator_profiles_update_own ON creator_profiles
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS creator_profiles_delete_own ON creator_profiles;
CREATE POLICY creator_profiles_delete_own ON creator_profiles
FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS creator_social_accounts_select ON creator_social_accounts;
CREATE POLICY creator_social_accounts_select ON creator_social_accounts
FOR SELECT USING (
  auth.uid() = creator_id
  OR EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.user_id = creator_social_accounts.creator_id AND cp.status = 'live')
);

DROP POLICY IF EXISTS creator_social_accounts_insert_own ON creator_social_accounts;
CREATE POLICY creator_social_accounts_insert_own ON creator_social_accounts
FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS creator_social_accounts_update_own ON creator_social_accounts;
CREATE POLICY creator_social_accounts_update_own ON creator_social_accounts
FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS creator_social_accounts_delete_own ON creator_social_accounts;
CREATE POLICY creator_social_accounts_delete_own ON creator_social_accounts
FOR DELETE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS creator_packages_select ON creator_packages;
CREATE POLICY creator_packages_select ON creator_packages
FOR SELECT USING (
  auth.uid() = creator_id
  OR EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.user_id = creator_packages.creator_id AND cp.status = 'live')
);

DROP POLICY IF EXISTS creator_packages_insert_own ON creator_packages;
CREATE POLICY creator_packages_insert_own ON creator_packages
FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS creator_packages_update_own ON creator_packages;
CREATE POLICY creator_packages_update_own ON creator_packages
FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS creator_packages_delete_own ON creator_packages;
CREATE POLICY creator_packages_delete_own ON creator_packages
FOR DELETE USING (auth.uid() = creator_id);


-- ========== 016: SMM-style creator_packages ==========
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'creator_social_accounts') THEN
    UPDATE creator_social_accounts
    SET follower_range = CASE
      WHEN follower_range IN ('0–1k', '1k–5k') THEN '0–5k'
      WHEN follower_range = '5k–10k' THEN '6k–20k'
      WHEN follower_range = '10k–50k' THEN '21k–50k'
      WHEN follower_range = '50k–100k' THEN '51k–100k'
      WHEN follower_range IN ('100k–500k', '500k+') THEN '100k+'
      WHEN follower_range IN ('0–5k', '6k–20k', '21k–50k', '51k–100k', '100k+') THEN follower_range
      ELSE '0–5k'
    END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'creator_packages') THEN
    TRUNCATE creator_packages;

    ALTER TABLE creator_packages
      DROP COLUMN IF EXISTS content_type,
      DROP COLUMN IF EXISTS duration_value,
      DROP COLUMN IF EXISTS duration_unit,
      DROP COLUMN IF EXISTS turnaround_time,
      DROP COLUMN IF EXISTS revisions,
      DROP COLUMN IF EXISTS includes_posting,
      DROP COLUMN IF EXISTS price;

    ALTER TABLE creator_packages
      ADD COLUMN IF NOT EXISTS activity_type TEXT,
      ADD COLUMN IF NOT EXISTS price_base_ngn NUMERIC,
      ADD COLUMN IF NOT EXISTS price_converted NUMERIC,
      ADD COLUMN IF NOT EXISTS currency TEXT,
      ADD COLUMN IF NOT EXISTS is_price_fixed BOOLEAN NOT NULL DEFAULT FALSE;

    ALTER TABLE creator_packages DROP CONSTRAINT IF EXISTS creator_packages_platform_check;
    ALTER TABLE creator_packages ADD CONSTRAINT creator_packages_platform_check
      CHECK (platform IN ('instagram', 'tiktok'));

    ALTER TABLE creator_packages DROP CONSTRAINT IF EXISTS creator_packages_activity_type_check;
    ALTER TABLE creator_packages ADD CONSTRAINT creator_packages_activity_type_check
      CHECK (activity_type IN ('instagram_reel', 'tiktok_video', 'instagram_story', 'tiktok_story', 'comment', 'repost'));

    ALTER TABLE creator_packages
      ALTER COLUMN activity_type SET NOT NULL,
      ALTER COLUMN price_base_ngn SET NOT NULL,
      ALTER COLUMN price_converted SET NOT NULL,
      ALTER COLUMN currency SET NOT NULL;
  END IF;
END $$;
