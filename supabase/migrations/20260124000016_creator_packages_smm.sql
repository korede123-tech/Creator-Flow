-- SMM-style creator_packages + pricing-tier follower ranges.
-- Breaks existing creator_packages; creators re-add packages.
-- Aligns follower_range with pricing tiers (Option A).
-- Requires 015 (creator_profiles, creator_social_accounts, creator_packages). Skips steps if tables missing.

DO $$
BEGIN
  -- 1. Follower-range alignment: map legacy creator_social_accounts values to new tiers
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

  -- 2. creator_packages: truncate and alter schema (only if table exists)
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
      CHECK (activity_type IN (
        'instagram_reel', 'tiktok_video',
        'instagram_story', 'tiktok_story',
        'comment', 'repost'
      ));

    ALTER TABLE creator_packages
      ALTER COLUMN activity_type SET NOT NULL,
      ALTER COLUMN price_base_ngn SET NOT NULL,
      ALTER COLUMN price_converted SET NOT NULL,
      ALTER COLUMN currency SET NOT NULL;
  END IF;
END $$;
