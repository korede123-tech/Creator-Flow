-- Wallet Transactions and Withdrawals

-- Ledger entries for tracking balance locks and movements
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('earning', 'withdrawal', 'adjustment')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  reference_id UUID,
  reference_type TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  paystack_reference TEXT,
  paystack_authorization_url TEXT,
  bank_account_id UUID,
  note TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Bank accounts for withdrawals
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Managed Creators System

-- Managed creators table
CREATE TABLE IF NOT EXISTS managed_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  niche TEXT,
  base_rate NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social accounts for managed creators
CREATE TABLE IF NOT EXISTS managed_creator_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  managed_creator_id UUID NOT NULL REFERENCES managed_creators(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  handle TEXT NOT NULL,
  profile_url TEXT,
  followers BIGINT NOT NULL DEFAULT 0,
  rate_override NUMERIC,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ledger_entries_user ON ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_status ON ledger_entries(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_managed_creators_manager ON managed_creators(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_managed_creator_socials_creator ON managed_creator_social_accounts(managed_creator_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON bank_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_managed_creators_updated_at
BEFORE UPDATE ON managed_creators
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_managed_creator_social_accounts_updated_at
BEFORE UPDATE ON managed_creator_social_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (MVP)
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_creator_social_accounts ENABLE ROW LEVEL SECURITY;

-- Bank accounts: user can manage their own
DROP POLICY IF EXISTS bank_accounts_select_own ON bank_accounts;
CREATE POLICY bank_accounts_select_own ON bank_accounts
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS bank_accounts_insert_own ON bank_accounts;
CREATE POLICY bank_accounts_insert_own ON bank_accounts
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS bank_accounts_update_own ON bank_accounts;
CREATE POLICY bank_accounts_update_own ON bank_accounts
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Withdrawal requests: user can view their own; creation handled server-side in MVP
DROP POLICY IF EXISTS withdrawal_requests_select_own ON withdrawal_requests;
CREATE POLICY withdrawal_requests_select_own ON withdrawal_requests
FOR SELECT USING (auth.uid() = user_id);

-- Ledger entries: user can view their own; server-only writes
DROP POLICY IF EXISTS ledger_entries_select_own ON ledger_entries;
CREATE POLICY ledger_entries_select_own ON ledger_entries
FOR SELECT USING (auth.uid() = user_id);

-- Managed creators: manager can manage their own roster
DROP POLICY IF EXISTS managed_creators_select_own ON managed_creators;
CREATE POLICY managed_creators_select_own ON managed_creators
FOR SELECT USING (auth.uid() = manager_user_id);

DROP POLICY IF EXISTS managed_creators_insert_own ON managed_creators;
CREATE POLICY managed_creators_insert_own ON managed_creators
FOR INSERT WITH CHECK (auth.uid() = manager_user_id);

DROP POLICY IF EXISTS managed_creators_update_own ON managed_creators;
CREATE POLICY managed_creators_update_own ON managed_creators
FOR UPDATE USING (auth.uid() = manager_user_id) WITH CHECK (auth.uid() = manager_user_id);

DROP POLICY IF EXISTS managed_creator_social_accounts_select_via_manager ON managed_creator_social_accounts;
CREATE POLICY managed_creator_social_accounts_select_via_manager ON managed_creator_social_accounts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM managed_creators mc
    WHERE mc.id = managed_creator_social_accounts.managed_creator_id
      AND mc.manager_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS managed_creator_social_accounts_insert_via_manager ON managed_creator_social_accounts;
CREATE POLICY managed_creator_social_accounts_insert_via_manager ON managed_creator_social_accounts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM managed_creators mc
    WHERE mc.id = managed_creator_social_accounts.managed_creator_id
      AND mc.manager_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS managed_creator_social_accounts_update_via_manager ON managed_creator_social_accounts;
CREATE POLICY managed_creator_social_accounts_update_via_manager ON managed_creator_social_accounts
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM managed_creators mc
    WHERE mc.id = managed_creator_social_accounts.managed_creator_id
      AND mc.manager_user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM managed_creators mc
    WHERE mc.id = managed_creator_social_accounts.managed_creator_id
      AND mc.manager_user_id = auth.uid()
  )
);
