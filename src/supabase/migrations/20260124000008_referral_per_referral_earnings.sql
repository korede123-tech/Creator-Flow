-- Per-referral earnings: store commission earned from each referred user.
-- Used by Profile → Referral history to show "+X" per referral.

ALTER TABLE referrals ADD COLUMN IF NOT EXISTS earned_from_referred NUMERIC NOT NULL DEFAULT 0;

-- Recreate trigger function to also update referrals.earned_from_referred
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
  IF NEW.type <> 'campaign_earning' OR NEW.status <> 'completed' OR NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM referral_commission_applied WHERE source_ledger_id = NEW.ledger_id) THEN
    RETURN NEW;
  END IF;

  v_currency := COALESCE(NEW.currency, 'NGN');

  SELECT owner_id INTO v_creator_id FROM wallets WHERE wallet_id = NEW.wallet_id;
  IF v_creator_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT referred_by INTO v_referrer_id FROM profiles WHERE user_id = v_creator_id;
  IF v_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

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

  v_commission := ROUND((NEW.amount * 0.02)::numeric, 2);
  IF v_commission <= 0 THEN
    RETURN NEW;
  END IF;

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

  UPDATE referrals
  SET earned_from_referred = earned_from_referred + v_commission
  WHERE referrer_user_id = v_referrer_id AND referred_user_id = v_creator_id;

  RETURN NEW;
END;
$$;
