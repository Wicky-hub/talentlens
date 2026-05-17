-- ============================================================
-- TalentLens — RLS owner-scoped policies for campaigns
--
-- Supersedes rls_campaign_write.sql. Run this file if you
-- have not run the previous one, or run both safely (each
-- policy uses DROP IF EXISTS before CREATE).
--
-- Rules:
--   SELECT  — anyone (anon + authenticated) can read all campaigns
--   INSERT  — authenticated users; new row's sme_id must equal auth.uid()
--   UPDATE  — authenticated users; only their own rows (sme_id = auth.uid())
--   DELETE  — authenticated users; only their own rows (sme_id = auth.uid())
--
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- ── SELECT (already exists in rls_policies.sql — safe to re-apply) ────────────

DROP POLICY IF EXISTS "anon_read_campaigns" ON campaigns;
CREATE POLICY "anon_read_campaigns"
  ON campaigns FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── INSERT ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "auth_insert_campaigns" ON campaigns;
CREATE POLICY "auth_insert_campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (sme_id = auth.uid());

-- ── UPDATE ────────────────────────────────────────────────────────────────────
-- USING   → filters which rows can be targeted for update
-- WITH CHECK → validates the row after the update (prevents changing sme_id)

DROP POLICY IF EXISTS "auth_update_campaigns" ON campaigns;
CREATE POLICY "auth_update_campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING     (sme_id = auth.uid())
  WITH CHECK (sme_id = auth.uid());

-- ── DELETE ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "auth_delete_campaigns" ON campaigns;
CREATE POLICY "auth_delete_campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (sme_id = auth.uid());

-- ── Verify ────────────────────────────────────────────────────────────────────

SELECT
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'campaigns'
ORDER BY cmd, policyname;
