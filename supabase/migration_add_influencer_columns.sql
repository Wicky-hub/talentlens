-- ============================================================
-- TalentLens — Migration: add missing columns to influencers
-- Safe to run multiple times (IF NOT EXISTS on every change).
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ── 1. Required (NOT NULL) columns ────────────────────────────────────────────
-- Added with DEFAULT so existing rows don't violate the constraint.
-- The defaults are intentionally empty/zero; real values come from
-- the seed script or the Data Collector Agent.

ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS username          text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS display_name      text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio               text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS following_count   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_count        integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location          text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile_image_url text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile_url       text    NOT NULL DEFAULT '';

-- ── 2. Optional (nullable) columns ────────────────────────────────────────────

ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS talent_score           integer,
  ADD COLUMN IF NOT EXISTS talent_score_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS apify_actor_run_id     text,
  ADD COLUMN IF NOT EXISTS last_scraped_at        timestamptz;

-- ── 3. Timestamp columns ───────────────────────────────────────────────────────

ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ── 4. Auto-update updated_at on every row change ─────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_influencers_updated_at ON influencers;

CREATE TRIGGER set_influencers_updated_at
  BEFORE UPDATE ON influencers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── 5. Unique constraint: one row per username+platform combo ──────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'influencers_username_platform_key'
  ) THEN
    ALTER TABLE influencers
      ADD CONSTRAINT influencers_username_platform_key
      UNIQUE (username, platform);
  END IF;
END $$;

-- ── 6. Indexes for the query patterns used by the dashboard ───────────────────

-- ORDER BY talent_score DESC (top influencers, matching)
CREATE INDEX IF NOT EXISTS idx_influencers_talent_score
  ON influencers (talent_score DESC NULLS LAST);

-- WHERE platform = $1  (platform filter)
CREATE INDEX IF NOT EXISTS idx_influencers_platform
  ON influencers (platform);

-- WHERE talent_score >= $1  (min score filter)
CREATE INDEX IF NOT EXISTS idx_influencers_talent_score_asc
  ON influencers (talent_score ASC NULLS LAST);

-- ORDER BY follower_count DESC / avg_engagement_rate DESC  (sort options)
CREATE INDEX IF NOT EXISTS idx_influencers_follower_count
  ON influencers (follower_count DESC);

CREATE INDEX IF NOT EXISTS idx_influencers_engagement_rate
  ON influencers (avg_engagement_rate DESC);

-- ── 7. Verify: show final column list ─────────────────────────────────────────

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'influencers'
ORDER BY ordinal_position;
