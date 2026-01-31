-- Referral commission: 2% of referred creators' payments for 6 months
-- Credits referrer's wallet (referral_commission) and profiles.referral_earnings.
-- Trigger runs when campaign_earning is completed (INSERT or UPDATE).

-- 1. Add 'referral_commission' to wallet_ledger type
ALTER TABLE wallet_ledger DROP CONSTRAINT IF EXISTS wallet_ledger_type_check;
ALTER TABLE wallet_ledger ADD CONSTRAINT wallet_ledger_type_check
  CHECK (type IN ('campaign_earning', 'withdrawal', 'adjustment', 'referral_commission'));

-- 2. Idempotency: which campaign_earning ledger rows have already triggered commission
CREATE TABLE IF NOT EXISTS referral_commission_applied (
  source_ledger_id UUID PRIMARY KEY REFERENCES wallet_ledger(ledger_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update wallet_balances: include referral_commission in income
CREATE OR REPLACE VIEW wallet_balances AS
SELECT
  w.wallet_id,
  w.owner_id,
  w.currency,
  COALESCE(SUM(CASE WHEN l.type IN ('campaign_earning', 'referral_commission') AND l.status = 'completed' THEN l.amount ELSE 0 END), 0) AS lifetime_earned,
  COALESCE(SUM(CASE WHEN l.type = 'withdrawal' AND l.status = 'completed' THEN l.amount ELSE 0 END), 0) AS lifetime_withdrawn,
  COALESCE(SUM(CASE WHEN l.type IN ('campaign_earning', 'referral_commission') AND l.status = 'completed' THEN l.amount ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN l.type = 'withdrawal' AND l.status IN ('pending','completed') THEN l.amount ELSE 0 END), 0) AS available_balance,
  COALESCE(SUM(CASE WHEN l.type = 'campaign_earning' AND l.status = 'pending' THEN l.amount ELSE 0 END), 0) AS pending_earnings,
  COALESCE(SUM(CASE WHEN l.type = 'withdrawal' AND l.status = 'pending' THEN l.amount ELSE 0 END), 0) AS pending_withdrawals
FROM wallets w
LEFT JOIN wallet_ledger l ON l.wallet_id = w.wallet_id
GROUP BY w.wallet_id, w.owner_id, w.currency;

-- 4. Trigger function: apply 2% referral commission when referred creator's campaign_earning completes
CREATE OR REPLACE FUNCTION public.apply_referral_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id UUID;
  v_referrer_id UUID;
  v_ref TIMESTAMPTZ;
  v_commission NUMERIC;
  v_referrer_wallet_id UUID;
  v_currency TEXT;
  v_window_end TIMESTAMPTZ;
BEGIN
  -- Only campaign_earning, completed, positive amount
  IF NEW.type <> 'campaign_earning' OR NEW.status <> 'completed' OR NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  -- Idempotency
  IF EXISTS (SELECT 1 FROM referral_commission_applied WHERE source_ledger_id = NEW.ledger_id) THEN
    RETURN NEW;
  END IF;

  v_currency := COALESCE(NEW.currency, 'NGN');

  -- Creator = wallet owner
  SELECT owner_id INTO v_creator_id FROM wallets WHERE wallet_id = NEW.wallet_id;
  IF v_creator_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Referrer from profile
  SELECT referred_by INTO v_referrer_id FROM profiles WHERE user_id = v_creator_id;
  IF v_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Referral window: 6 months from activation (or creation)
  SELECT COALESCE(r.activated_at, r.created_at) INTO v_ref
    FROM referrals r
    WHERE r.referrer_user_id = v_referrer_id AND r.referred_user_id = v_creator_id
    LIMIT 1;
  IF v_ref IS NULL THEN
    RETURN NEW;
  END IF;

  v_window_end := v_ref + INTERVAL '6 months';
  IF NOW() > v_window_end THEN
    RETURN NEW;
  END IF;

  -- Commission 2%
  v_commission := ROUND((NEW.amount * 0.02)::numeric, 2);
  IF v_commission <= 0 THEN
    RETURN NEW;
  END IF;

  -- Referrer's wallet
  SELECT wallet_id INTO v_referrer_wallet_id FROM creators WHERE creator_id = v_referrer_id;
  IF v_referrer_wallet_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO referral_commission_applied (source_ledger_id) VALUES (NEW.ledger_id);

  INSERT INTO wallet_ledger (
    wallet_id, type, amount, currency, status, reference, note, completed_at
  ) VALUES (
    v_referrer_wallet_id,
    'referral_commission',
    v_commission,
    v_currency,
    'completed',
    'REF-' || NEW.ledger_id::text,
    '2% referral from creator',
    NOW()
  );

  UPDATE profiles
  SET referral_earnings = referral_earnings + v_commission,
      updated_at = NOW()
  WHERE user_id = v_referrer_id;

  RETURN NEW;
END;
$$;

-- 5. Triggers: INSERT (when inserted already completed) and UPDATE (when transition to completed)
DROP TRIGGER IF EXISTS trg_referral_commission_on_ledger_insert ON wallet_ledger;
CREATE TRIGGER trg_referral_commission_on_ledger_insert
  AFTER INSERT ON wallet_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_referral_commission();

DROP TRIGGER IF EXISTS trg_referral_commission_on_ledger_update ON wallet_ledger;
CREATE TRIGGER trg_referral_commission_on_ledger_update
  AFTER UPDATE OF status ON wallet_ledger
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION public.apply_referral_commission();
