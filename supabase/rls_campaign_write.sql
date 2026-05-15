-- ============================================================
-- TalentLens — RLS write policies for campaigns table
--
-- Allows authenticated users to INSERT and UPDATE only their
-- own campaigns (rows where sme_id = auth.uid()).
-- The existing anon/authenticated SELECT policy is untouched.
--
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ── INSERT: authenticated users can create their own campaigns ─────────────────

DROP POLICY IF EXISTS "auth_insert_campaigns" ON campaigns;
CREATE POLICY "auth_insert_campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (sme_id = auth.uid());

-- ── UPDATE: authenticated users can edit only their own campaigns ──────────────

DROP POLICY IF EXISTS "auth_update_campaigns" ON campaigns;
CREATE POLICY "auth_update_campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (sme_id = auth.uid())
  WITH CHECK (sme_id = auth.uid());

-- ── DELETE: authenticated users can delete only their own campaigns ────────────

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
