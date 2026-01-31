-- Agencies table
CREATE TABLE IF NOT EXISTS agencies (
  agency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  wallet_id UUID REFERENCES wallets(wallet_id),
  status TEXT CHECK (status IN ('active', 'pending', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator memberships (links creators to agencies)
CREATE TABLE IF NOT EXISTS creator_memberships (
  membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{"approve_content": true, "edit_profile": true, "manage_payouts": false}'::jsonb,
  status TEXT CHECK (status IN ('active', 'pending', 'removed')) DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(creator_id, agency_id)
);

-- Orders table (brand requests for creators, especially All Creators pool)
CREATE TABLE IF NOT EXISTS orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(agency_id),
  requested_count INTEGER NOT NULL,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  total_budget DECIMAL(12, 2),
  status TEXT CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'partial')) DEFAULT 'draft',
  approved_by UUID REFERENCES creators(creator_id),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table (submitted post URLs and verified records)
CREATE TABLE IF NOT EXISTS posts (
  post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_campaign_id UUID NOT NULL REFERENCES creator_campaigns(id) ON DELETE CASCADE,
  post_url TEXT NOT NULL,
  post_platform TEXT NOT NULL CHECK (post_platform IN ('tiktok', 'instagram', 'youtube')),
  platform_post_id TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'failed', 'needs_proof')) DEFAULT 'pending',
  metrics_json JSONB,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  is_live BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post metrics snapshots (daily metrics for 14-30 days)
CREATE TABLE IF NOT EXISTS post_metrics_snapshots (
  snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5, 2),
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, snapshot_date)
);

-- Assets table (drafts, approved files, revisions, proofs)
CREATE TABLE IF NOT EXISTS assets (
  asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_campaign_id UUID NOT NULL REFERENCES creator_campaigns(id) ON DELETE CASCADE,
  asset_type TEXT CHECK (asset_type IN ('draft', 'revision', 'approved', 'raw', 'thumbnail', 'proof_screenshot')) NOT NULL,
  file_url TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'archived')) DEFAULT 'pending',
  feedback TEXT,
  approved_by UUID REFERENCES creators(creator_id),
  approved_at TIMESTAMP WITH TIME ZONE,
  usage_rights TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow events (audit trail for state transitions)
CREATE TABLE IF NOT EXISTS workflow_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_campaign_id UUID NOT NULL REFERENCES creator_campaigns(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_type TEXT CHECK (actor_type IN ('creator', 'agency', 'system', 'ops')) NOT NULL,
  actor_id UUID,
  reason TEXT,
  related_asset_id UUID REFERENCES assets(asset_id),
  related_post_id UUID REFERENCES posts(post_id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing calculator configs (Nigeria-first defaults)
CREATE TABLE IF NOT EXISTS pricing_configs (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type TEXT NOT NULL, -- 'follower_tier', 'deliverable_multiplier', 'rights_multiplier', etc.
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  currency TEXT DEFAULT 'NGN',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(config_type, key)
);

-- Update creator_campaigns with extended status
ALTER TABLE creator_campaigns DROP CONSTRAINT IF EXISTS creator_campaigns_status_check;
ALTER TABLE creator_campaigns ADD CONSTRAINT creator_campaigns_status_check 
  CHECK (status IN ('offered', 'accepted', 'in_draft', 'submitted', 'needs_revision', 'approved', 'ready_to_post', 'posted_submitted', 'posted_verified', 'paid', 'failed', 'cancelled'));

-- Add workflow tracking columns
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS current_step TEXT;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS needs_action BOOLEAN DEFAULT FALSE;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS payment_unlocked BOOLEAN DEFAULT FALSE;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS payment_unlocked_at TIMESTAMP WITH TIME ZONE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agencies_status ON agencies(status);
CREATE INDEX IF NOT EXISTS idx_creator_memberships_creator ON creator_memberships(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_memberships_agency ON creator_memberships(agency_id);
CREATE INDEX IF NOT EXISTS idx_orders_campaign ON orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_posts_creator_campaign ON posts(creator_campaign_id);
CREATE INDEX IF NOT EXISTS idx_posts_verification_status ON posts(verification_status);
CREATE INDEX IF NOT EXISTS idx_post_metrics_snapshots_post ON post_metrics_snapshots(post_id);
CREATE INDEX IF NOT EXISTS idx_post_metrics_snapshots_date ON post_metrics_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_assets_creator_campaign ON assets(creator_campaign_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_workflow_events_creator_campaign ON workflow_events(creator_campaign_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_created_at ON workflow_events(created_at);

-- Insert default pricing configs for Nigeria
INSERT INTO pricing_configs (config_type, key, value, currency) VALUES
  -- Follower tiers (NGN)
  ('follower_tier', '1k-10k', '{"min": 15000, "max": 50000}'::jsonb, 'NGN'),
  ('follower_tier', '10k-50k', '{"min": 50000, "max": 200000}'::jsonb, 'NGN'),
  ('follower_tier', '50k-200k', '{"min": 200000, "max": 600000}'::jsonb, 'NGN'),
  ('follower_tier', '200k-1m', '{"min": 600000, "max": 2500000}'::jsonb, 'NGN'),
  ('follower_tier', '1m+', '{"min": 2500000, "max": 10000000}'::jsonb, 'NGN'),
  
  -- Deliverable multipliers
  ('deliverable_multiplier', 'tiktok_30_45s', '1.0'::jsonb, 'NGN'),
  ('deliverable_multiplier', 'tiktok_60s_concept', '1.3'::jsonb, 'NGN'),
  ('deliverable_multiplier', 'ig_reel', '1.1'::jsonb, 'NGN'),
  ('deliverable_multiplier', 'story_set_3', '0.6'::jsonb, 'NGN'),
  ('deliverable_multiplier', 'carousel', '0.9'::jsonb, 'NGN'),
  ('deliverable_multiplier', 'youtube_short', '1.2'::jsonb, 'NGN'),
  
  -- Rights multipliers
  ('rights_multiplier', 'organic', '1.0'::jsonb, 'NGN'),
  ('rights_multiplier', '30d_paid', '1.3'::jsonb, 'NGN'),
  ('rights_multiplier', '90d_paid', '1.6'::jsonb, 'NGN'),
  ('rights_multiplier', 'buyout', '2.5'::jsonb, 'NGN'),
  
  -- Exclusivity multipliers
  ('exclusivity_multiplier', 'none', '1.0'::jsonb, 'NGN'),
  ('exclusivity_multiplier', '7d', '1.15'::jsonb, 'NGN'),
  ('exclusivity_multiplier', '30d', '1.35'::jsonb, 'NGN'),
  ('exclusivity_multiplier', '90d', '1.7'::jsonb, 'NGN'),
  
  -- Urgency multipliers
  ('urgency_multiplier', 'standard', '1.0'::jsonb, 'NGN'),
  ('urgency_multiplier', 'fast', '1.25'::jsonb, 'NGN'),
  ('urgency_multiplier', 'rush', '1.6'::jsonb, 'NGN'),
  
  -- Platform fees
  ('platform_fee', 'standard', '{"percentage": 15, "description": "Dobble Tap platform fee"}'::jsonb, 'NGN'),
  ('platform_fee', 'all_creators', '{"percentage": 12, "description": "All Creators handling fee"}'::jsonb, 'NGN'),
  
  -- CPM ranges by niche
  ('cpm_range', 'beauty', '{"min": 1200, "max": 2500}'::jsonb, 'NGN'),
  ('cpm_range', 'finance', '{"min": 1500, "max": 2500}'::jsonb, 'NGN'),
  ('cpm_range', 'music', '{"min": 800, "max": 1800}'::jsonb, 'NGN'),
  ('cpm_range', 'food', '{"min": 1000, "max": 2000}'::jsonb, 'NGN'),
  ('cpm_range', 'tech', '{"min": 1200, "max": 2200}'::jsonb, 'NGN'),
  ('cpm_range', 'general', '{"min": 800, "max": 1500}'::jsonb, 'NGN')
ON CONFLICT (config_type, key) DO NOTHING;

-- Triggers for updated_at
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_configs_updated_at BEFORE UPDATE ON pricing_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
