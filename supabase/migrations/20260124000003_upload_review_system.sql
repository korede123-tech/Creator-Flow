-- Upload and Review System Tables
-- Uses assets table from 20260124000002 (PK: asset_id). No separate assets create here.

-- Review tokens for secure review links
CREATE TABLE IF NOT EXISTS review_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_campaign_id UUID NOT NULL REFERENCES creator_campaigns(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review decisions for approval workflow
CREATE TABLE IF NOT EXISTS review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_campaign_id UUID NOT NULL REFERENCES creator_campaigns(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('agency', 'client', 'ops')),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'changes_requested')),
  feedback TEXT,
  priority TEXT CHECK (priority IN ('minor', 'medium', 'major')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Managed accounts for agency/manager multi-account support
CREATE TABLE IF NOT EXISTS managed_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
  managed_creator_id UUID NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('full', 'limited')) DEFAULT 'limited',
  consent_given BOOLEAN DEFAULT FALSE,
  consent_given_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, managed_creator_id)
);

-- Update creator_campaigns status constraint to include new states
ALTER TABLE creator_campaigns DROP CONSTRAINT IF EXISTS creator_campaigns_status_check;
ALTER TABLE creator_campaigns ADD CONSTRAINT creator_campaigns_status_check 
  CHECK (status IN (
    'offered', 
    'accepted', 
    'upload_required',
    'uploaded',
    'in_review',
    'needs_revision',
    'approved', 
    'ready_to_post', 
    'posted_submitted', 
    'posted_verified', 
    'paid', 
    'failed', 
    'cancelled'
  ));

-- Add fields for tracking upload and post submission
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS current_asset_version INTEGER DEFAULT 0;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS post_url TEXT;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS last_feedback TEXT;

-- Indexes for performance (assets indexes may exist from 002; IF NOT EXISTS is safe)
CREATE INDEX IF NOT EXISTS idx_assets_creator_campaign ON assets(creator_campaign_id);
CREATE INDEX IF NOT EXISTS idx_assets_version ON assets(creator_campaign_id, version);
CREATE INDEX IF NOT EXISTS idx_review_tokens_token ON review_tokens(token);
CREATE INDEX IF NOT EXISTS idx_review_tokens_expires ON review_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_review_decisions_creator_campaign ON review_decisions(creator_campaign_id);
CREATE INDEX IF NOT EXISTS idx_managed_accounts_owner ON managed_accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_managed_accounts_managed ON managed_accounts(managed_creator_id);

-- Function to generate secure tokens
CREATE OR REPLACE FUNCTION generate_secure_token(prefix TEXT DEFAULT '')
RETURNS TEXT AS $$
BEGIN
  RETURN prefix || encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on managed_accounts
CREATE OR REPLACE FUNCTION update_managed_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_managed_accounts_updated_at_trigger
BEFORE UPDATE ON managed_accounts
FOR EACH ROW EXECUTE FUNCTION update_managed_accounts_updated_at();
