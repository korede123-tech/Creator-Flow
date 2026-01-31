-- Payment completion (demo): create campaign_earning (completed) and set campaign to paid.
-- Used when "Mark as posted (demo)" runs. Idempotent; triggers referral commission.

CREATE OR REPLACE FUNCTION public.complete_campaign_earning_for_posted(p_creator_campaign_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id UUID;
  v_rate NUMERIC;
  v_status TEXT;
  v_wallet_id UUID;
  v_exists BOOLEAN;
BEGIN
  SELECT creator_id, rate, status INTO v_creator_id, v_rate, v_status
  FROM creator_campaigns
  WHERE id = p_creator_campaign_id;

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Campaign not found');
  END IF;
  IF v_creator_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not your campaign');
  END IF;
  IF v_status IS NULL OR v_status NOT IN ('posted', 'posted_verified') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Campaign must be posted before completing payment');
  END IF;
  IF v_rate IS NULL OR v_rate <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid campaign rate');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM wallet_ledger
    WHERE creator_campaign_id = p_creator_campaign_id AND type = 'campaign_earning'
  ) INTO v_exists;
  IF v_exists THEN
    UPDATE creator_campaigns SET status = 'paid', updated_at = NOW() WHERE id = p_creator_campaign_id;
    RETURN jsonb_build_object('ok', true, 'already_completed', true);
  END IF;

  SELECT wallet_id INTO v_wallet_id FROM creators WHERE creator_id = v_creator_id;
  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Creator wallet not found');
  END IF;

  INSERT INTO wallet_ledger (wallet_id, type, amount, currency, status, creator_campaign_id, completed_at)
  VALUES (v_wallet_id, 'campaign_earning', v_rate, 'NGN', 'completed', p_creator_campaign_id, NOW());

  UPDATE creator_campaigns SET status = 'paid', updated_at = NOW() WHERE id = p_creator_campaign_id;

  RETURN jsonb_build_object('ok', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_campaign_earning_for_posted(UUID) TO authenticated;
