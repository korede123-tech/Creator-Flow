-- Platform-owned demo campaigns (created_by NULL) for seed_demo_offers.
-- Idempotent: only insert if not already present.

INSERT INTO campaigns (created_by, brand, title, platform, deliverable, compensation, timeline)
SELECT NULL, 'Glossy Beauty', 'Spring Skincare Launch', 'tiktok',
  '60-second haul video showcasing 3 products. Tag brand, use #GlossySpring.', 50000, '2 weeks'
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.brand = 'Glossy Beauty' AND c.title = 'Spring Skincare Launch' AND c.created_by IS NULL
);

INSERT INTO campaigns (created_by, brand, title, platform, deliverable, compensation, timeline)
SELECT NULL, 'FitLife', 'Workout Gear Drops', 'instagram',
  '3 Reels + 5 Stories. Show morning routine with FitLife gear.', 85000, '3 weeks'
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.brand = 'FitLife' AND c.title = 'Workout Gear Drops' AND c.created_by IS NULL
);

INSERT INTO campaigns (created_by, brand, title, platform, deliverable, compensation, timeline)
SELECT NULL, 'TechHub', 'Wireless Earbuds Unboxing', 'youtube',
  '1 unboxing video + 1 week later review. Include discount code.', 120000, '1 month'
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.brand = 'TechHub' AND c.title = 'Wireless Earbuds Unboxing' AND c.created_by IS NULL
);

-- Link managed creators to platform creators (for agency "manage campaign requests").
ALTER TABLE managed_creators
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES creators(creator_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_managed_creators_creator ON managed_creators(creator_id);

-- Agency can SELECT creator_campaigns for creators they manage.
DROP POLICY IF EXISTS creator_campaigns_select_managed ON creator_campaigns;
CREATE POLICY creator_campaigns_select_managed ON creator_campaigns
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM managed_creators mc
    WHERE mc.creator_id = creator_campaigns.creator_id AND mc.manager_user_id = auth.uid()
  )
);
