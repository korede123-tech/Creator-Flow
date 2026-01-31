-- Seed demo offers (creator_campaigns) for the current user. Uses platform-owned campaigns.
-- Ensures creator + wallet exist (same as handle_new_user) if missing, then seeds offers.

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

  -- Ensure creator row exists (and wallet). Mirrors handle_new_user for users who lack it.
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
