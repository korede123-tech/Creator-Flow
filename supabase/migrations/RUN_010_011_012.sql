-- Run migrations 010, 011, 012 in order. Paste this entire file into Supabase SQL Editor and click Run.

-- ========== 20260124000010_campaigns_created_by_and_rls ==========
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS campaigns_select_all_authed ON campaigns;
CREATE POLICY campaigns_select_all_authed ON campaigns
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS campaigns_insert_own ON campaigns;
CREATE POLICY campaigns_insert_own ON campaigns
FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS campaigns_update_own ON campaigns;
CREATE POLICY campaigns_update_own ON campaigns
FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS creator_campaigns_insert_offer ON creator_campaigns;
CREATE POLICY creator_campaigns_insert_offer ON creator_campaigns
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM campaigns c WHERE c.campaign_id = creator_campaigns.campaign_id AND c.created_by = auth.uid())
);

CREATE OR REPLACE FUNCTION public.send_offer_to_email(
  p_campaign_id UUID,
  p_creator_email TEXT,
  p_rate NUMERIC,
  p_deadline TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id UUID;
  v_owner UUID;
BEGIN
  SELECT created_by INTO v_owner FROM campaigns WHERE campaign_id = p_campaign_id;
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Campaign not found');
  END IF;
  IF v_owner <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not campaign owner');
  END IF;
  SELECT user_id INTO v_creator_id FROM profiles WHERE LOWER(TRIM(email)) = LOWER(TRIM(p_creator_email)) LIMIT 1;
  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Creator not found');
  END IF;
  INSERT INTO creator_campaigns (creator_id, campaign_id, status, rate, deadline, offer_date)
  VALUES (v_creator_id, p_campaign_id, 'offered', p_rate, p_deadline, NOW())
  ON CONFLICT (creator_id, campaign_id) DO NOTHING;
  RETURN jsonb_build_object('ok', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.send_offer_to_email(UUID, TEXT, NUMERIC, TIMESTAMPTZ) TO authenticated;

-- ========== 20260124000011_seed_demo_campaigns ==========
CREATE OR REPLACE FUNCTION public.seed_demo_campaigns()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_offers INT;
  v_deadline TIMESTAMPTZ := NOW() + INTERVAL '14 days';
  v_cids UUID[];
  v_wallet_id UUID;
  v_display_name TEXT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM creators WHERE creator_id = v_uid) THEN
    v_display_name := 'Creator';
    SELECT COALESCE(full_name, 'Creator') INTO v_display_name FROM profiles WHERE user_id = v_uid LIMIT 1;
    INSERT INTO public.creators (creator_id, display_name, created_at, updated_at)
    VALUES (v_uid, v_display_name, NOW(), NOW())
    ON CONFLICT (creator_id) DO NOTHING;
    SELECT wallet_id INTO v_wallet_id FROM public.wallets WHERE owner_id = v_uid;
    IF v_wallet_id IS NULL THEN
      INSERT INTO public.wallets (owner_id, currency) VALUES (v_uid, 'NGN') RETURNING wallet_id INTO v_wallet_id;
    END IF;
    UPDATE public.creators SET wallet_id = v_wallet_id WHERE creator_id = v_uid AND wallet_id IS NULL;
  END IF;
  SELECT COUNT(*)::INT INTO v_offers FROM creator_campaigns WHERE creator_id = v_uid;
  IF v_offers > 0 THEN
    RETURN jsonb_build_object('ok', true, 'message', 'You already have offers; no demo data added.');
  END IF;
  SELECT ARRAY_AGG(campaign_id ORDER BY CASE
    WHEN brand = 'Glossy Beauty' AND title = 'Spring Skincare Launch' THEN 1
    WHEN brand = 'FitLife' AND title = 'Workout Gear Drops' THEN 2
    WHEN brand = 'TechHub' AND title = 'Wireless Earbuds Unboxing' THEN 3
    ELSE 4
  END)
  INTO v_cids
  FROM campaigns
  WHERE created_by IS NULL
    AND (
      (brand = 'Glossy Beauty' AND title = 'Spring Skincare Launch')
      OR (brand = 'FitLife' AND title = 'Workout Gear Drops')
      OR (brand = 'TechHub' AND title = 'Wireless Earbuds Unboxing')
    );
  IF v_cids IS NULL OR array_length(v_cids, 1) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Platform demo campaigns not found. Run migration 20260124000012.');
  END IF;
  INSERT INTO creator_campaigns (creator_id, campaign_id, status, rate, deadline, offer_date)
  VALUES
    (v_uid, v_cids[1], 'offered', 50000, v_deadline, NOW()),
    (v_uid, v_cids[2], 'offered', 85000, v_deadline, NOW()),
    (v_uid, v_cids[3], 'offered', 120000, v_deadline, NOW());
  RETURN jsonb_build_object('ok', true, 'message', '3 demo offers added.');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.seed_demo_campaigns() TO authenticated;

-- ========== 20260124000012_platform_demos_and_managed_creator_id ==========
INSERT INTO campaigns (created_by, brand, title, platform, deliverable, compensation, timeline)
SELECT NULL, 'Glossy Beauty', 'Spring Skincare Launch', 'tiktok',
  '60-second haul video showcasing 3 products. Tag brand, use #GlossySpring.', 50000, '2 weeks'
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.brand = 'Glossy Beauty' AND c.title = 'Spring Skincare Launch' AND c.created_by IS NULL
);
INSERT INTO campaigns (created_by, brand, title, platform, deliverable, compensation, timeline)
SELECT NULL, 'FitLife', 'Workout Gear Drops', 'instagram',
  '3 Reels + 5 Stories. Show morning routine with FitLife gear.', 85000, '3 weeks'
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.brand = 'FitLife' AND c.title = 'Workout Gear Drops' AND c.created_by IS NULL
);
INSERT INTO campaigns (created_by, brand, title, platform, deliverable, compensation, timeline)
SELECT NULL, 'TechHub', 'Wireless Earbuds Unboxing', 'youtube',
  '1 unboxing video + 1 week later review. Include discount code.', 120000, '1 month'
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.brand = 'TechHub' AND c.title = 'Wireless Earbuds Unboxing' AND c.created_by IS NULL
);

ALTER TABLE managed_creators
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES creators(creator_id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_managed_creators_creator ON managed_creators(creator_id);

DROP POLICY IF EXISTS creator_campaigns_select_managed ON creator_campaigns;
CREATE POLICY creator_campaigns_select_managed ON creator_campaigns
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM managed_creators mc
    WHERE mc.creator_id = creator_campaigns.creator_id AND mc.manager_user_id = auth.uid()
  )
);
