-- ============================================================
-- TalentLens — Row Level Security Policies
-- Allows the anon role (unauthenticated requests via anon key)
-- to READ all four tables. Write operations still require the
-- service role key (agents only, never the browser).
--
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ── influencers ───────────────────────────────────────────────────────────────

ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_influencers" ON influencers;
CREATE POLICY "anon_read_influencers"
  ON influencers FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── campaigns ─────────────────────────────────────────────────────────────────

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_campaigns" ON campaigns;
CREATE POLICY "anon_read_campaigns"
  ON campaigns FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── campaign_matches ──────────────────────────────────────────────────────────

ALTER TABLE campaign_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_campaign_matches" ON campaign_matches;
CREATE POLICY "anon_read_campaign_matches"
  ON campaign_matches FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── reports ───────────────────────────────────────────────────────────────────

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_reports" ON reports;
CREATE POLICY "anon_read_reports"
  ON reports FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── Verify ────────────────────────────────────────────────────────────────────

SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
