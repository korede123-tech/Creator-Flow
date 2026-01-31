-- Add post-related columns to creator_campaigns table
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS post_url TEXT;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS post_platform TEXT CHECK (post_platform IN ('tiktok', 'instagram', 'youtube'));
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS post_id TEXT;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS post_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS post_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS scrape_status TEXT CHECK (scrape_status IN ('queued', 'running', 'success', 'needs_manual_proof', 'failed'));
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS scrape_error TEXT;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS metrics_json JSONB;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0;
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS proof_type TEXT CHECK (proof_type IN ('scraped', 'manual', 'none'));
ALTER TABLE creator_campaigns ADD COLUMN IF NOT EXISTS proof_asset_url TEXT;

-- Create post_scrape_jobs table
CREATE TABLE IF NOT EXISTS post_scrape_jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_campaign_id UUID NOT NULL REFERENCES creator_campaigns(id) ON DELETE CASCADE,
  attempt INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'success', 'failed')),
  next_run_at TIMESTAMP WITH TIME ZONE,
  provider TEXT NOT NULL CHECK (provider IN ('tiktok', 'instagram', 'youtube')),
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_campaigns_scrape_status ON creator_campaigns(scrape_status);
CREATE INDEX IF NOT EXISTS idx_creator_campaigns_post_submitted_at ON creator_campaigns(post_submitted_at);
CREATE INDEX IF NOT EXISTS idx_post_scrape_jobs_status ON post_scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_post_scrape_jobs_next_run_at ON post_scrape_jobs(next_run_at);
CREATE INDEX IF NOT EXISTS idx_post_scrape_jobs_creator_campaign_id ON post_scrape_jobs(creator_campaign_id);

-- Create campaign tokens table for secure public access
CREATE TABLE IF NOT EXISTS campaign_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  creator_campaign_id UUID NOT NULL REFERENCES creator_campaigns(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('offer', 'upload', 'post_submit')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_tokens_token ON campaign_tokens(token);
CREATE INDEX IF NOT EXISTS idx_campaign_tokens_creator_campaign_id ON campaign_tokens(creator_campaign_id);

-- Update updated_at trigger for post_scrape_jobs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_scrape_jobs_updated_at
  BEFORE UPDATE ON post_scrape_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
