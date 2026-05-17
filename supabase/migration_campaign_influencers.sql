-- campaign_influencers: links campaigns to influencers with AI match metadata
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS campaign_influencers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id   uuid        NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  match_score     integer     NOT NULL DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
  ai_reasoning    text,
  estimated_reach integer     NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','contacted','confirmed','rejected')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (campaign_id, influencer_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_influencers_campaign ON campaign_influencers (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_influencers_status   ON campaign_influencers (campaign_id, status);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE campaign_influencers ENABLE ROW LEVEL SECURITY;

-- Campaign owners can insert / update / delete their own rows
CREATE POLICY "campaign owners manage influencers"
  ON campaign_influencers FOR ALL
  USING (
    campaign_id IN (SELECT id FROM campaigns WHERE sme_id = auth.uid())
  )
  WITH CHECK (
    campaign_id IN (SELECT id FROM campaigns WHERE sme_id = auth.uid())
  );

-- Public read (matches are visible to anyone browsing the campaign)
CREATE POLICY "public read campaign influencers"
  ON campaign_influencers FOR SELECT
  USING (true);
