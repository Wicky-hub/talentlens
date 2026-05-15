-- ============================================================
-- TalentLens — Migration: add brand, dates, platforms to campaigns
-- Safe to run multiple times (IF NOT EXISTS on every change).
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS brand            text,
  ADD COLUMN IF NOT EXISTS start_date       date,
  ADD COLUMN IF NOT EXISTS end_date         date,
  ADD COLUMN IF NOT EXISTS target_platforms text[] NOT NULL DEFAULT '{}';

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'campaigns'
ORDER BY ordinal_position;
