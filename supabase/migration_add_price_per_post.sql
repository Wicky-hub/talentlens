-- Add price_per_post column to influencers
-- Estimated rate: GREATEST(฿500, follower_count × ฿0.30)
ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS price_per_post integer NOT NULL DEFAULT 0;

-- Backfill existing rows (run once after ALTER TABLE)
UPDATE influencers
SET price_per_post = GREATEST(500, (follower_count * 0.30)::integer)
WHERE price_per_post = 0;
