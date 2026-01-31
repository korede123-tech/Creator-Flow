-- Campaign ownership and RLS for create campaign + send offer.

-- 1. Campaign owner (agency/brand)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. RLS: campaigns
DROP POLICY IF EXISTS campaigns_select_all_authed ON campaigns;
CREATE POLICY campaigns_select_all_authed ON campaigns
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS campaigns_insert_own ON campaigns;
CREATE POLICY campaigns_insert_own ON campaigns
FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS campaigns_update_own ON campaigns;
CREATE POLICY campaigns_update_own ON campaigns
FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- 3. creator_campaigns: allow INSERT when user owns the campaign (send offer)
DROP POLICY IF EXISTS creator_campaigns_insert_offer ON creator_campaigns;
CREATE POLICY creator_campaigns_insert_offer ON creator_campaigns
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM campaigns c WHERE c.campaign_id = creator_campaigns.campaign_id AND c.created_by = auth.uid())
);

-- 4. RPC: send offer to creator by email (campaign owner only)
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
