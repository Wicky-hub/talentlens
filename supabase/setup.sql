-- ============================================================
-- TalentLens — Full Setup Script
-- Creates tables from scratch + inserts 20 mock Thai influencers
-- and 5 demo campaigns ready for dashboard preview.
--
-- ⚠️  This script DROPS existing influencers and campaigns tables.
--     Run on a fresh database or when a clean slate is acceptable.
--
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================


-- ── 0. Clean slate ────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS campaign_matches CASCADE;
DROP TABLE IF EXISTS reports          CASCADE;
DROP TABLE IF EXISTS campaigns        CASCADE;
DROP TABLE IF EXISTS influencers      CASCADE;


-- ── 1. influencers ────────────────────────────────────────────────────────────

CREATE TABLE influencers (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  username                text        NOT NULL,
  platform                text        NOT NULL
                                        CHECK (platform IN ('instagram','tiktok','youtube','facebook')),
  display_name            text        NOT NULL,
  bio                     text        NOT NULL DEFAULT '',

  -- Metrics
  follower_count          integer     NOT NULL DEFAULT 0,
  following_count         integer     NOT NULL DEFAULT 0,
  post_count              integer     NOT NULL DEFAULT 0,
  avg_engagement_rate     numeric(6,4) NOT NULL DEFAULT 0,

  -- Categorisation
  categories              text[]      NOT NULL DEFAULT '{}',
  location                text        NOT NULL DEFAULT '',

  -- Profile links
  profile_image_url       text        NOT NULL DEFAULT '',
  profile_url             text        NOT NULL DEFAULT '',

  -- Scoring (populated by Scoring Agent)
  talent_score            integer     CHECK (talent_score BETWEEN 0 AND 100),
  talent_score_breakdown  jsonb,

  -- Scraping metadata
  apify_actor_run_id      text,
  last_scraped_at         timestamptz,

  -- Timestamps
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT influencers_username_platform_key UNIQUE (username, platform)
);

-- Indexes for dashboard query patterns
CREATE INDEX idx_influencers_talent_score     ON influencers (talent_score DESC NULLS LAST);
CREATE INDEX idx_influencers_follower_count   ON influencers (follower_count DESC);
CREATE INDEX idx_influencers_engagement_rate  ON influencers (avg_engagement_rate DESC);
CREATE INDEX idx_influencers_platform         ON influencers (platform);


-- ── 2. campaigns ─────────────────────────────────────────────────────────────

CREATE TABLE campaigns (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner (references auth user → SME; relaxed for demo)
  sme_id              uuid        NOT NULL,

  -- Details
  name                text        NOT NULL,
  description         text        NOT NULL DEFAULT '',
  budget              numeric(12,2) NOT NULL DEFAULT 0,

  -- Targeting
  target_categories   text[]      NOT NULL DEFAULT '{}',
  target_location     text,
  min_followers       integer     NOT NULL DEFAULT 0,
  max_followers       integer     NOT NULL DEFAULT 2147483647,
  min_talent_score    integer     NOT NULL DEFAULT 0
                                    CHECK (min_talent_score BETWEEN 0 AND 100),

  -- Status
  status              text        NOT NULL DEFAULT 'draft'
                                    CHECK (status IN ('draft','active','completed')),

  -- Timestamps
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_status     ON campaigns (status);
CREATE INDEX idx_campaigns_created_at ON campaigns (created_at DESC);


-- ── 3. campaign_matches ───────────────────────────────────────────────────────

CREATE TABLE campaign_matches (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid        NOT NULL REFERENCES campaigns(id)   ON DELETE CASCADE,
  influencer_id  uuid        NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  match_score    numeric(5,4) NOT NULL DEFAULT 0
                               CHECK (match_score BETWEEN 0 AND 1),
  status         text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','approved','rejected')),
  matched_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT campaign_matches_unique UNIQUE (campaign_id, influencer_id)
);

CREATE INDEX idx_matches_campaign    ON campaign_matches (campaign_id);
CREATE INDEX idx_matches_influencer  ON campaign_matches (influencer_id);
CREATE INDEX idx_matches_score       ON campaign_matches (match_score DESC);


-- ── 4. reports ────────────────────────────────────────────────────────────────

CREATE TABLE reports (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid        NOT NULL REFERENCES campaigns(id)   ON DELETE CASCADE,
  influencer_id  uuid        NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  content        text        NOT NULL DEFAULT '',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_campaign   ON reports (campaign_id);
CREATE INDEX idx_reports_created_at ON reports (created_at DESC);


-- ── 5. updated_at trigger (shared by influencers + campaigns) ─────────────────

CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_influencers_updated_at
  BEFORE UPDATE ON influencers
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();


-- ── 6. INSERT: 20 mock Thai influencers ───────────────────────────────────────

INSERT INTO influencers
  (username, platform, display_name, bio,
   follower_count, following_count, post_count,
   avg_engagement_rate, categories, location,
   profile_image_url, profile_url,
   talent_score, talent_score_breakdown, last_scraped_at)
VALUES

-- BEAUTY ──────────────────────────────────────────────────────────────────────
(
  'beauty_by_ploy', 'instagram', 'พลอย บิวตี้',
  'รีวิวเมคอัพและสกินแคร์ | แนะนำผลิตภัณฑ์ราคาดี คุณภาพดี | Bangkok 🌸',
  85000, 1200, 421, 0.0620,
  ARRAY['beauty','makeup','skincare'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=beauty_by_ploy',
  'https://instagram.com/beauty_by_ploy',
  78,
  '{"total":78,"engagement":25,"authenticity":22,"content_quality":19,"growth":12,
    "fake_follower_pct":8,
    "rationale":"engagement 6.2% สูงกว่า baseline อัตราผู้ติดตามปลอมต่ำ (8%) เนื้อหาสม่ำเสมอ เหมาะสำหรับแบรนด์ความงามระดับกลาง"}'::jsonb,
  now() - interval '1 day'
),
(
  'mintmakeup_th', 'tiktok', 'มินท์ เมคอัพ',
  'สอนแต่งหน้าสไตล์เกาหลีและไทย | duet ได้เลยนะคะ 💄 | มินท์ มีนบุรี',
  121000, 890, 638, 0.0780,
  ARRAY['beauty','makeup','k-beauty'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=mintmakeup_th',
  'https://tiktok.com/@mintmakeup_th',
  82,
  '{"total":82,"engagement":27,"authenticity":23,"content_quality":20,"growth":12,
    "fake_follower_pct":5,
    "rationale":"TikTok engagement 7.8% สูงมาก ผู้ติดตามปลอมต่ำ (5%) เนื้อหาสอนแต่งหน้าได้รับความนิยม เหมาะกับแบรนด์ cosmetics กลุ่มอายุ 18-30 ปี"}'::jsonb,
  now() - interval '2 days'
),
(
  'skincare_noon', 'instagram', 'หนูน สกินแคร์',
  'Skincare routine สำหรับสาวไทย ☀️ รีวิวจริง ไม่ปั้นแต่ง | เชียงใหม่',
  46000, 2100, 289, 0.0510,
  ARRAY['beauty','skincare','wellness'], 'เชียงใหม่',
  'https://i.pravatar.cc/150?u=skincare_noon',
  'https://instagram.com/skincare_noon',
  72,
  '{"total":72,"engagement":22,"authenticity":21,"content_quality":18,"growth":11,
    "fake_follower_pct":9,
    "rationale":"engagement 5.1% ดี ผู้ติดตามส่วนใหญ่เป็นกลุ่มภาคเหนือ เนื้อหา ingredient-based ดึงดูดผู้ใส่ใจผลิตภัณฑ์จริงจัง"}'::jsonb,
  now() - interval '3 days'
),
(
  'glowwithgift', 'youtube', 'กิ๊ฟ กลอว์',
  'Beauty YouTuber | รีวิว skincare & makeup ทุกสัปดาห์ ✨ | กรุงเทพฯ',
  63000, 540, 187, 0.0430,
  ARRAY['beauty','skincare','lifestyle'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=glowwithgift',
  'https://youtube.com/@glowwithgift',
  68,
  '{"total":68,"engagement":19,"authenticity":20,"content_quality":18,"growth":11,
    "fake_follower_pct":12,
    "rationale":"YouTube engagement 4.3% ดีสำหรับแพลตฟอร์ม วิดีโอรีวิวยาวช่วยสร้าง trust ผู้ติดตามปลอมปานกลาง (12%)"}'::jsonb,
  now() - interval '4 days'
),

-- FOOD ────────────────────────────────────────────────────────────────────────
(
  'aroi_mak_mak', 'instagram', 'อาร์ท อร่อยมากมาก',
  'ตามหาของอร่อยทั่วกรุงเทพฯ 🍜 | ร้านซ่อน ร้านดัง ครบ | DM สอบถามได้ตลอด',
  154000, 3200, 892, 0.0580,
  ARRAY['food','restaurant','street food'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=aroi_mak_mak',
  'https://instagram.com/aroi_mak_mak',
  76,
  '{"total":76,"engagement":24,"authenticity":21,"content_quality":19,"growth":12,
    "fake_follower_pct":11,
    "rationale":"engagement 5.8% ดีมากสำหรับ food account ขนาดนี้ ครอบคลุมร้านทั่วกรุงเทพฯ เหมาะกับร้านอาหารและแบรนด์ food delivery"}'::jsonb,
  now() - interval '1 day'
),
(
  'chef_arm_th', 'tiktok', 'อาร์ม เชฟ',
  'เชฟสอนทำอาหาร | เมนูง่ายๆ ทำได้ที่บ้าน 🍳 | เชียงใหม่',
  94000, 1100, 512, 0.0890,
  ARRAY['food','cooking','recipe'], 'เชียงใหม่',
  'https://i.pravatar.cc/150?u=chef_arm_th',
  'https://tiktok.com/@chef_arm_th',
  85,
  '{"total":85,"engagement":29,"authenticity":22,"content_quality":21,"growth":13,
    "fake_follower_pct":7,
    "rationale":"TikTok engagement 8.9% สูงมาก เนื้อหาทำอาหารแชร์สูง ผู้ติดตามปลอมต่ำ (7%) เหมาะกับแบรนด์เครื่องปรุงและ cooking equipment"}'::jsonb,
  now() - interval '2 days'
),
(
  'foodiepim', 'youtube', 'พิม ฟู้ดดี้',
  'ตะลุยกิน ทั้งไทย ทั้งเทศ 🌍 | รีวิวร้านอาหาร + vlog กิน | กรุงเทพฯ',
  79000, 670, 203, 0.0470,
  ARRAY['food','restaurant','travel food'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=foodiepim',
  'https://youtube.com/@foodiepim',
  71,
  '{"total":71,"engagement":21,"authenticity":21,"content_quality":18,"growth":11,
    "fake_follower_pct":10,
    "rationale":"YouTube food channel ขนาดกลาง engagement ดี ครอบคลุมทั้งอาหารไทยและต่างประเทศ เหมาะกับแบรนด์ food & beverage ที่ต้องการ long-form content"}'::jsonb,
  now() - interval '5 days'
),
(
  'streetfood_pun', 'instagram', 'ปั้น สตรีทฟู้ด',
  'Street food hunter พัทยา & ชลบุรี 🛵 | หาบเร่ แผงลอย ซอยลับ',
  53000, 1800, 674, 0.0660,
  ARRAY['food','street food','local food'], 'พัทยา',
  'https://i.pravatar.cc/150?u=streetfood_pun',
  'https://instagram.com/streetfood_pun',
  74,
  '{"total":74,"engagement":24,"authenticity":22,"content_quality":17,"growth":11,
    "fake_follower_pct":6,
    "rationale":"engagement 6.6% สูง เนื้อหา street food มีความ authentic ผู้ติดตามปลอมต่ำ (6%) เหมาะกับแบรนด์อาหารท้องถิ่นและ food delivery ภาคตะวันออก"}'::jsonb,
  now() - interval '3 days'
),

-- LIFESTYLE ───────────────────────────────────────────────────────────────────
(
  'life_with_nook', 'instagram', 'นุ๊ก ไลฟ์สไตล์',
  'ชีวิตดีๆ ที่ออกแบบเอง 🏠 | home decor, daily routine, self-care | BKK',
  109000, 2400, 531, 0.0490,
  ARRAY['lifestyle','home decor','self-care'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=life_with_nook',
  'https://instagram.com/life_with_nook',
  74,
  '{"total":74,"engagement":22,"authenticity":21,"content_quality":20,"growth":11,
    "fake_follower_pct":13,
    "rationale":"engagement 4.9% ดีสำหรับ lifestyle account เนื้อหาครอบคลุม home, daily life, self-care ผู้ติดตามปลอมปานกลาง (13%) ควรติดตามแนวโน้ม"}'::jsonb,
  now() - interval '2 days'
),
(
  'jeab_lifestyle', 'tiktok', 'เจ็บ ไลฟ์',
  'ใช้ชีวิตให้คุ้ม! 💸 saving tips, side hustle, lifestyle upgrade | เจ็บ BKK',
  187000, 730, 891, 0.0920,
  ARRAY['lifestyle','finance','productivity'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=jeab_lifestyle',
  'https://tiktok.com/@jeab_lifestyle',
  88,
  '{"total":88,"engagement":30,"authenticity":23,"content_quality":22,"growth":13,
    "fake_follower_pct":4,
    "rationale":"TikTok engagement 9.2% สูงมากเป็นพิเศษ ผู้ติดตามปลอมต่ำที่สุด (4%) ฐานแฟน Gen Z คุณภาพสูง เนื้อหา lifestyle + finance ดึงดูดกลุ่มที่มีกำลังซื้อ"}'::jsonb,
  now() - interval '1 day'
),
(
  'daily_kwan', 'instagram', 'กวาง เดลี่',
  'ชีวิตสาวขอนแก่น 🌾 | อาหาร เที่ยว แต่งตัว everyday content | ภาคอีสาน',
  39000, 1450, 318, 0.0550,
  ARRAY['lifestyle','fashion','local life'], 'ขอนแก่น',
  'https://i.pravatar.cc/150?u=daily_kwan',
  'https://instagram.com/daily_kwan',
  70,
  '{"total":70,"engagement":22,"authenticity":23,"content_quality":16,"growth":9,
    "fake_follower_pct":5,
    "rationale":"engagement 5.5% ดีมากสำหรับ micro-influencer ภูมิภาค ผู้ติดตามปลอมต่ำ (5%) ฐานแฟนแน่นภาคอีสาน เหมาะกับแบรนด์ที่ต้องการตลาดต่างจังหวัด"}'::jsonb,
  now() - interval '6 days'
),
(
  'modernliving_nat', 'facebook', 'แนท โมเดิร์น',
  'Interior + ไลฟ์สไตล์คนเมือง 🏙️ | แต่งบ้านงบน้อย ดูแพง | กรุงเทพฯ',
  53000, 3100, 445, 0.0380,
  ARRAY['lifestyle','home decor','interior'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=modernliving_nat',
  'https://facebook.com/modernliving_nat',
  65,
  '{"total":65,"engagement":17,"authenticity":20,"content_quality":17,"growth":11,
    "fake_follower_pct":14,
    "rationale":"Facebook engagement 3.8% ปานกลาง เนื้อหา home decor แชร์สูง ผู้ติดตามปลอมอยู่ในระดับที่ควรระวัง (14%) เหมาะกับแบรนด์เฟอร์นิเจอร์"}'::jsonb,
  now() - interval '4 days'
),

-- FITNESS ─────────────────────────────────────────────────────────────────────
(
  'fitmind_tan', 'instagram', 'ต้น ฟิตมายด์',
  'Personal trainer 💪 | workout routine, meal prep, mindset | ต้น สีลม',
  89000, 1350, 487, 0.0690,
  ARRAY['fitness','workout','nutrition'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=fitmind_tan',
  'https://instagram.com/fitmind_tan',
  80,
  '{"total":80,"engagement":26,"authenticity":22,"content_quality":20,"growth":12,
    "fake_follower_pct":7,
    "rationale":"engagement 6.9% สูง ผู้ติดตามปลอมต่ำ (7%) community คุณภาพ เนื้อหาครอบคลุม workout + nutrition เหมาะกับแบรนด์ supplement, gym equipment, activewear"}'::jsonb,
  now() - interval '2 days'
),
(
  'yoga_with_bua', 'tiktok', 'บัว โยคะ',
  'Yoga & mindfulness สไตล์ไทย 🧘‍♀️ | สอนท่าพื้นฐานถึงขั้นสูง | เชียงใหม่',
  68000, 820, 423, 0.0810,
  ARRAY['fitness','yoga','wellness'], 'เชียงใหม่',
  'https://i.pravatar.cc/150?u=yoga_with_bua',
  'https://tiktok.com/@yoga_with_bua',
  83,
  '{"total":83,"engagement":28,"authenticity":24,"content_quality":19,"growth":12,
    "fake_follower_pct":3,
    "rationale":"TikTok engagement 8.1% สูงมาก ผู้ติดตามปลอมต่ำที่สุดในกลุ่ม (3%) community engage สูง เหมาะกับแบรนด์ wellness, yoga mat, health supplement"}'::jsonb,
  now() - interval '1 day'
),
(
  'running_jib', 'instagram', 'จิ๊บ รันนิ่ง',
  'นักวิ่งสาว 🏃‍♀️ | ฝึกซ้อมมาราธอน, รีวิวรองเท้าวิ่ง | BKK runner community',
  43000, 1680, 356, 0.0570,
  ARRAY['fitness','running','sport'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=running_jib',
  'https://instagram.com/running_jib',
  73,
  '{"total":73,"engagement":23,"authenticity":23,"content_quality":16,"growth":11,
    "fake_follower_pct":4,
    "rationale":"engagement 5.7% ดี ผู้ติดตามปลอมต่ำมาก (4%) ชุมชนนักวิ่งแน่น เหมาะกับแบรนด์รองเท้าวิ่ง อุปกรณ์กีฬา sports nutrition"}'::jsonb,
  now() - interval '7 days'
),
(
  'gymlife_dew', 'youtube', 'ดิ้ว ยิม',
  'Gym vlog & workout tutorials 🏋️ | สอนออกกำลังกายถูกวิธี | ดิ้ว ลาดพร้าว',
  32000, 590, 124, 0.0420,
  ARRAY['fitness','gym','bodybuilding'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=gymlife_dew',
  'https://youtube.com/@gymlife_dew',
  63,
  '{"total":63,"engagement":18,"authenticity":22,"content_quality":14,"growth":9,
    "fake_follower_pct":6,
    "rationale":"YouTube fitness channel เล็กแต่ authentic ผู้ติดตามปลอมต่ำ (6%) เนื้อหา tutorial คุณภาพดี growth potential สูงหากสร้างเนื้อหาสม่ำเสมอ"}'::jsonb,
  now() - interval '5 days'
),

-- TRAVEL ──────────────────────────────────────────────────────────────────────
(
  'wanderlust_aom', 'instagram', 'อ้อม วันเดอร์ลัสต์',
  'เที่ยวทั่วไทย ทั่วโลก ✈️ | hidden gems, budget travel, solo trip | BKK',
  133000, 2900, 748, 0.0540,
  ARRAY['travel','lifestyle','photography'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=wanderlust_aom',
  'https://instagram.com/wanderlust_aom',
  76,
  '{"total":76,"engagement":23,"authenticity":21,"content_quality":20,"growth":12,
    "fake_follower_pct":9,
    "rationale":"engagement 5.4% ดีสำหรับ travel account ขนาดนี้ ครอบคลุมในและนอกประเทศ เหมาะกับแบรนด์ hotel, airline, travel insurance, luggage"}'::jsonb,
  now() - interval '3 days'
),
(
  'travelbug_per', 'tiktok', 'เปร เทรเวล',
  'ท่องเที่ยวภูเก็ตและอันดามัน 🏝️ | รีวิวรีสอร์ท, ที่กิน, กิจกรรม | ภูเก็ต',
  196000, 960, 1024, 0.1010,
  ARRAY['travel','beach','resort'], 'ภูเก็ต',
  'https://i.pravatar.cc/150?u=travelbug_per',
  'https://tiktok.com/@travelbug_per',
  91,
  '{"total":91,"engagement":30,"authenticity":23,"content_quality":23,"growth":15,
    "fake_follower_pct":3,
    "rationale":"TikTok engagement 10.1% สูงที่สุดในกลุ่มทั้งหมด ผู้ติดตามปลอมต่ำมาก (3%) เนื้อหาท่องเที่ยวภูเก็ตดึงดูดทั้งคนไทยและต่างชาติ เหมาะอย่างยิ่งสำหรับโรงแรมและทัวร์อันดามัน"}'::jsonb,
  now() - interval '1 day'
),
(
  'backpack_nai', 'youtube', 'ไน แบ็คแพ็ค',
  'Backpacker สายประหยัด 🎒 | เที่ยวงบ 3000 ได้จริง! | vlog ทุกอาทิตย์',
  88000, 710, 231, 0.0450,
  ARRAY['travel','budget travel','vlog'], 'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=backpack_nai',
  'https://youtube.com/@backpack_nai',
  71,
  '{"total":71,"engagement":20,"authenticity":22,"content_quality":18,"growth":11,
    "fake_follower_pct":8,
    "rationale":"YouTube travel vlog engagement 4.5% ดี เนื้อหา budget travel ดึงดูดคนหนุ่มสาว เหมาะกับแบรนด์ hostel, bus booking, outdoor gear"}'::jsonb,
  now() - interval '4 days'
),
(
  'hidden_gem_tam', 'instagram', 'ต้ม ฮิดเดนเจม',
  'ค้นหาที่เที่ยวซ่อนเร้น เชียงราย และภาคเหนือ 🏔️ | ธรรมชาติ วัฒนธรรม วิถีชีวิต',
  73000, 1560, 512, 0.0730,
  ARRAY['travel','nature','culture'], 'เชียงราย',
  'https://i.pravatar.cc/150?u=hidden_gem_tam',
  'https://instagram.com/hidden_gem_tam',
  79,
  '{"total":79,"engagement":26,"authenticity":22,"content_quality":19,"growth":12,
    "fake_follower_pct":7,
    "rationale":"engagement 7.3% สูงดีสำหรับ niche travel ภาคเหนือ เนื้อหา hidden gem ได้รับการ save และแชร์มาก เหมาะกับแบรนด์ท่องเที่ยวเชิงวัฒนธรรม"}'::jsonb,
  now() - interval '2 days'
);


-- ── 7. INSERT: 5 demo campaigns ───────────────────────────────────────────────
-- sme_id uses a fixed demo UUID (no real SME row required for demo).

INSERT INTO campaigns
  (sme_id, name, description, budget,
   target_categories, target_location,
   min_followers, max_followers, min_talent_score, status)
VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'แคมเปญ Glow Serum เปิดตัวใหม่',
  'หาอินฟลูเอนเซอร์ด้าน beauty และ skincare รีวิว serum ใหม่ของแบรนด์ เน้นกลุ่มผู้หญิงอายุ 20-35 ปี ในกรุงเทพฯ',
  85000, ARRAY['beauty','skincare'], 'กรุงเทพมหานคร',
  30000, 200000, 65, 'active'
),
(
  '00000000-0000-0000-0000-000000000001',
  'รีวิวร้านอาหาร The Local Kitchen',
  'หา food influencer รีวิวเมนูใหม่และบรรยากาศร้านในช่วง soft opening เน้น Instagram และ TikTok',
  50000, ARRAY['food','restaurant'], 'กรุงเทพมหานคร',
  40000, 180000, 60, 'active'
),
(
  '00000000-0000-0000-0000-000000000001',
  'โปรโมต Phuket Resort ซีซั่นใหม่',
  'หา travel influencer รีวิวรีสอร์ทและกิจกรรมในภูเก็ต เน้นผู้ติดตาม 80K+ ที่มี engagement สูง',
  120000, ARRAY['travel','beach'], 'ภูเก็ต',
  80000, 250000, 70, 'active'
),
(
  '00000000-0000-0000-0000-000000000001',
  'แคมเปญ Protein Bar สายฟิตเนส',
  'รีวิว protein bar รสชาติใหม่ผ่าน fitness influencer เน้น authentic review และ before/after content',
  40000, ARRAY['fitness','nutrition'], NULL,
  25000, 120000, 60, 'draft'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Lifestyle Brand Awareness Q1',
  'แคมเปญสร้าง brand awareness สำหรับแบรนด์ไลฟ์สไตล์ ครอบคลุมหลายแพลตฟอร์ม',
  75000, ARRAY['lifestyle','fashion'], 'กรุงเทพมหานคร',
  35000, 200000, 65, 'completed'
);


-- ── 8. Verify ─────────────────────────────────────────────────────────────────

SELECT '=== influencers ===' AS info,
  count(*)                              AS total,
  round(avg(talent_score))              AS avg_score,
  round(avg(avg_engagement_rate)*100,2) AS avg_engagement_pct
FROM influencers;

SELECT '=== by niche ===' AS info, unnest(categories) AS category, count(*) AS influencers
FROM influencers
GROUP BY category
ORDER BY influencers DESC
LIMIT 10;

SELECT '=== campaigns ===' AS info, status, count(*) AS total
FROM campaigns
GROUP BY status;
