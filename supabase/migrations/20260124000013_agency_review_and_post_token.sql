-- Agency can update creator_campaigns (approve / request revision) for managed creators.

DROP POLICY IF EXISTS creator_campaigns_update_managed ON creator_campaigns;
CREATE POLICY creator_campaigns_update_managed ON creator_campaigns
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM managed_creators mc
    WHERE mc.creator_id = creator_campaigns.creator_id AND mc.manager_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM managed_creators mc
    WHERE mc.creator_id = creator_campaigns.creator_id AND mc.manager_user_id = auth.uid()
  )
);

-- Get or create post_submit token for creator (when status is approved/ready_to_post).
CREATE OR REPLACE FUNCTION public.get_or_create_post_submit_token(p_creator_campaign_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id UUID;
  v_status TEXT;
  v_token TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT creator_id, status INTO v_creator_id, v_status
  FROM creator_campaigns
  WHERE id = p_creator_campaign_id;

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Campaign not found');
  END IF;
  IF v_creator_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not your campaign');
  END IF;
  IF v_status IS NULL OR v_status NOT IN ('approved', 'ready_to_post') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Campaign must be approved before submitting post');
  END IF;

  SELECT ct.token INTO v_token
  FROM campaign_tokens ct
  WHERE ct.creator_campaign_id = p_creator_campaign_id
    AND ct.token_type = 'post_submit'
    AND ct.expires_at > NOW()
    AND (ct.used = FALSE OR ct.used IS NULL)
  ORDER BY ct.created_at DESC
  LIMIT 1;

  IF v_token IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'token', v_token);
  END IF;

  v_token := encode(gen_random_bytes(24), 'base64');
  v_token := replace(replace(v_token, '+', '-'), '/', '_');
  v_expires := NOW() + INTERVAL '30 days';

  INSERT INTO campaign_tokens (token, creator_campaign_id, token_type, expires_at, used)
  VALUES (v_token, p_creator_campaign_id, 'post_submit', v_expires, FALSE);

  RETURN jsonb_build_object('ok', true, 'token', v_token);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_post_submit_token(UUID) TO authenticated;
