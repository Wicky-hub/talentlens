-- ============================================================
-- TalentLens — Mock Thai Influencer Seed Data
-- 20 influencers across: beauty, food, lifestyle, fitness, travel
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

INSERT INTO influencers (
  username, platform, display_name, bio,
  follower_count, following_count, post_count,
  avg_engagement_rate, categories, location,
  profile_image_url, profile_url,
  talent_score, talent_score_breakdown,
  last_scraped_at
) VALUES

-- ── BEAUTY ────────────────────────────────────────────────────────────────────

(
  'beauty_by_ploy',
  'instagram',
  'พลอย บิวตี้',
  'รีวิวเมคอัพและสกินแคร์ | แนะนำผลิตภัณฑ์ราคาดี คุณภาพดี | Bangkok 🌸 collab: ploy@beauty.th',
  85000, 1200, 421,
  0.062,
  ARRAY['beauty', 'makeup', 'skincare'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=beauty_by_ploy',
  'https://instagram.com/beauty_by_ploy',
  78,
  '{"total":78,"engagement":25,"authenticity":22,"content_quality":19,"growth":12,"fake_follower_pct":8,"rationale":"อัตรา engagement 6.2% สูงกว่า baseline อย่างมีนัยสำคัญ บัญชีมีความน่าเชื่อถือสูง ผู้ติดตามปลอมอยู่ในระดับต่ำ (8%) เนื้อหาสม่ำเสมอและมีคุณภาพ เหมาะสำหรับแบรนด์ความงามระดับกลาง"}'::jsonb,
  NOW() - INTERVAL '1 day'
),
(
  'mintmakeup_th',
  'tiktok',
  'มินท์ เมคอัพ',
  'สอนแต่งหน้าสไตล์เกาหลีและไทย | duet ได้เลยนะคะ 💄 | มินท์ มีนบุรี',
  121000, 890, 638,
  0.078,
  ARRAY['beauty', 'makeup', 'k-beauty'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=mintmakeup_th',
  'https://tiktok.com/@mintmakeup_th',
  82,
  '{"total":82,"engagement":27,"authenticity":23,"content_quality":20,"growth":12,"fake_follower_pct":5,"rationale":"TikTok engagement 7.8% สูงมากสำหรับแพลตฟอร์มนี้ ผู้ติดตามปลอมต่ำมาก (5%) แสดงถึงฐานแฟนที่แท้จริง เนื้อหาสอนแต่งหน้าได้รับความนิยมสูง เหมาะสำหรับแบรนด์ cosmetics ที่ต้องการเข้าถึงกลุ่มอายุ 18-30 ปี"}'::jsonb,
  NOW() - INTERVAL '2 days'
),
(
  'skincare_noon',
  'instagram',
  'หนูน สกินแคร์',
  'Skincare routine สำหรับสาวไทย ☀️ รีวิวจริง ไม่ปั้นแต่ง | เชียงใหม่ | noon.skincare@gmail.com',
  46000, 2100, 289,
  0.051,
  ARRAY['beauty', 'skincare', 'wellness'],
  'เชียงใหม่',
  'https://i.pravatar.cc/150?u=skincare_noon',
  'https://instagram.com/skincare_noon',
  72,
  '{"total":72,"engagement":22,"authenticity":21,"content_quality":18,"growth":11,"fake_follower_pct":9,"rationale":"engagement 5.1% ดีสำหรับ niche สกินแคร์ ผู้ติดตามส่วนใหญ่เป็นสาวเชียงใหม่และภาคเหนือ อัตราผู้ติดตามปลอมต่ำ เนื้อหาเน้น ingredient-based ซึ่งดึงดูดกลุ่มที่ใส่ใจผลิตภัณฑ์จริงจัง"}'::jsonb,
  NOW() - INTERVAL '3 days'
),
(
  'glowwithgift',
  'youtube',
  'กิ๊ฟ กลอว์',
  'Beauty YouTuber | รีวิว skincare & makeup ทุกสัปดาห์ | หาดใหญ่ to กรุงเทพฯ ✨',
  63000, 540, 187,
  0.043,
  ARRAY['beauty', 'skincare', 'lifestyle'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=glowwithgift',
  'https://youtube.com/@glowwithgift',
  68,
  '{"total":68,"engagement":19,"authenticity":20,"content_quality":18,"growth":11,"fake_follower_pct":12,"rationale":"YouTube engagement 4.3% อยู่ในระดับดีสำหรับแพลตฟอร์ม ผู้ติดตามปลอมอยู่ในระดับปานกลาง (12%) วิดีโอรีวิวยาวช่วยสร้าง trust กับผู้ชม เหมาะกับแบรนด์ที่ต้องการ in-depth review"}'::jsonb,
  NOW() - INTERVAL '4 days'
),

-- ── FOOD ──────────────────────────────────────────────────────────────────────

(
  'aroi_mak_mak',
  'instagram',
  'อาร์ท อร่อยมากมาก',
  'ตามหาของอร่อยทั่วกรุงเทพฯ 🍜 | ร้านซ่อน ร้านดัง ครบ | DM สอบถามได้ตลอด',
  154000, 3200, 892,
  0.058,
  ARRAY['food', 'restaurant', 'street food'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=aroi_mak_mak',
  'https://instagram.com/aroi_mak_mak',
  76,
  '{"total":76,"engagement":24,"authenticity":21,"content_quality":19,"growth":12,"fake_follower_pct":11,"rationale":"engagement 5.8% ดีมากสำหรับ food account ขนาดนี้ ครอบคลุมร้านอาหารทั่วกรุงเทพฯ ทำให้เหมาะกับร้านอาหารและแบรนด์ food delivery ผู้ติดตามปลอมอยู่ในระดับยอมรับได้"}'::jsonb,
  NOW() - INTERVAL '1 day'
),
(
  'chef_arm_th',
  'tiktok',
  'อาร์ม เชฟ',
  'เชฟสอนทำอาหาร | เมนูง่ายๆ ทำได้ที่บ้าน 🍳 | เชียงใหม่ | สูตรลับส่งทาง DM',
  94000, 1100, 512,
  0.089,
  ARRAY['food', 'cooking', 'recipe'],
  'เชียงใหม่',
  'https://i.pravatar.cc/150?u=chef_arm_th',
  'https://tiktok.com/@chef_arm_th',
  85,
  '{"total":85,"engagement":29,"authenticity":22,"content_quality":21,"growth":13,"fake_follower_pct":7,"rationale":"TikTok engagement 8.9% สูงมาก เนื้อหาทำอาหารได้รับการแชร์สูง ผู้ติดตามปลอมต่ำ (7%) ฐานแฟนแน่น เหมาะกับแบรนด์เครื่องปรุง, ครัว และ cooking equipment อย่างมาก"}'::jsonb,
  NOW() - INTERVAL '2 days'
),
(
  'foodiepim',
  'youtube',
  'พิม ฟู้ดดี้',
  'ตะลุยกิน ทั้งไทย ทั้งเทศ 🌍 | รีวิวร้านอาหาร + vlog กิน | สมัครสมาชิกด่วน!',
  79000, 670, 203,
  0.047,
  ARRAY['food', 'restaurant', 'travel food'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=foodiepim',
  'https://youtube.com/@foodiepim',
  71,
  '{"total":71,"engagement":21,"authenticity":21,"content_quality":18,"growth":11,"fake_follower_pct":10,"rationale":"YouTube food channel ขนาดกลาง engagement ดี วิดีโอรีวิวร้านอาหารช่วยให้ผู้ชมตัดสินใจได้ ครอบคลุมทั้งร้านไทยและอาหารต่างประเทศ เหมาะกับแบรนด์ food & beverage ที่ต้องการ long-form content"}'::jsonb,
  NOW() - INTERVAL '5 days'
),
(
  'streetfood_pun',
  'instagram',
  'ปั้น สตรีทฟู้ด',
  'Street food hunter พัทยา & ชลบุรี 🛵 | หาบเร่ แผงลอย ซอยลับ | ปั้น ชลบุรี',
  53000, 1800, 674,
  0.066,
  ARRAY['food', 'street food', 'local food'],
  'พัทยา',
  'https://i.pravatar.cc/150?u=streetfood_pun',
  'https://instagram.com/streetfood_pun',
  74,
  '{"total":74,"engagement":24,"authenticity":22,"content_quality":17,"growth":11,"fake_follower_pct":6,"rationale":"engagement 6.6% สูงดี เนื้อหา street food มีความ authentic สูง ผู้ติดตามปลอมต่ำมาก (6%) เน้นกลุ่มคนพัทยาและนักท่องเที่ยว เหมาะกับแบรนด์อาหารท้องถิ่นและ food delivery ในภาคตะวันออก"}'::jsonb,
  NOW() - INTERVAL '3 days'
),

-- ── LIFESTYLE ─────────────────────────────────────────────────────────────────

(
  'life_with_nook',
  'instagram',
  'นุ๊ก ไลฟ์สไตล์',
  'ชีวิตดีๆ ที่ออกแบบเอง 🏠 | home decor, daily routine, self-care | BKK girl',
  109000, 2400, 531,
  0.049,
  ARRAY['lifestyle', 'home decor', 'self-care'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=life_with_nook',
  'https://instagram.com/life_with_nook',
  74,
  '{"total":74,"engagement":22,"authenticity":21,"content_quality":20,"growth":11,"fake_follower_pct":13,"rationale":"engagement 4.9% ดีสำหรับ lifestyle account ขนาดนี้ เนื้อหาครอบคลุม home, daily life, self-care ทำให้ reach แบรนด์ได้หลากหลาย ผู้ติดตามปลอมอยู่ในระดับปานกลาง ควรตรวจสอบ authenticity เพิ่มเติม"}'::jsonb,
  NOW() - INTERVAL '2 days'
),
(
  'jeab_lifestyle',
  'tiktok',
  'เจ็บ ไลฟ์',
  'ใช้ชีวิตให้คุ้ม! 💸 saving tips, side hustle, lifestyle upgrade | เจ็บ BKK',
  187000, 730, 891,
  0.092,
  ARRAY['lifestyle', 'finance', 'productivity'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=jeab_lifestyle',
  'https://tiktok.com/@jeab_lifestyle',
  88,
  '{"total":88,"engagement":30,"authenticity":23,"content_quality":22,"growth":13,"fake_follower_pct":4,"rationale":"TikTok engagement 9.2% สูงมากเป็นพิเศษ ผู้ติดตามปลอมต่ำที่สุดในกลุ่ม (4%) แสดงถึงฐานแฟนที่แท้จริงและมีคุณภาพสูง เนื้อหา lifestyle + finance ดึงดูดกลุ่ม Gen Z และ millennials ที่มีกำลังซื้อ"}'::jsonb,
  NOW() - INTERVAL '1 day'
),
(
  'daily_kwan',
  'instagram',
  'กวาง เดลี่',
  'ชีวิตสาวขอนแก่น 🌾 | อาหาร เที่ยว แต่งตัว everyday content | ภาคอีสาน represent!',
  39000, 1450, 318,
  0.055,
  ARRAY['lifestyle', 'fashion', 'local life'],
  'ขอนแก่น',
  'https://i.pravatar.cc/150?u=daily_kwan',
  'https://instagram.com/daily_kwan',
  70,
  '{"total":70,"engagement":22,"authenticity":23,"content_quality":16,"growth":9,"fake_follower_pct":5,"rationale":"engagement 5.5% ดีมากสำหรับ micro-influencer ภูมิภาค ผู้ติดตามปลอมต่ำ (5%) ฐานแฟนแน่นในภาคอีสาน เหมาะกับแบรนด์ที่ต้องการเข้าถึงตลาดต่างจังหวัดแบบ authentic"}'::jsonb,
  NOW() - INTERVAL '6 days'
),
(
  'modernliving_nat',
  'facebook',
  'แนท โมเดิร์น',
  'Interior + ไลฟ์สไตล์คนเมือง 🏙️ | แต่งบ้านงบน้อย ดูแพง | แชร์ได้เลยนะ',
  53000, 3100, 445,
  0.038,
  ARRAY['lifestyle', 'home decor', 'interior'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=modernliving_nat',
  'https://facebook.com/modernliving_nat',
  65,
  '{"total":65,"engagement":17,"authenticity":20,"content_quality":17,"growth":11,"fake_follower_pct":14,"rationale":"Facebook engagement 3.8% อยู่ในระดับปานกลางสำหรับแพลตฟอร์ม เนื้อหา home decor ได้รับการแชร์สูง ผู้ติดตามปลอมอยู่ในระดับที่ควรระวัง (14%) เหมาะกับแบรนด์เฟอร์นิเจอร์และของแต่งบ้าน"}'::jsonb,
  NOW() - INTERVAL '4 days'
),

-- ── FITNESS ───────────────────────────────────────────────────────────────────

(
  'fitmind_tan',
  'instagram',
  'ต้น ฟิตมายด์',
  'Personal trainer 💪 | workout routine, meal prep, mindset | ต้น สีลม | PT session DM',
  89000, 1350, 487,
  0.069,
  ARRAY['fitness', 'workout', 'nutrition'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=fitmind_tan',
  'https://instagram.com/fitmind_tan',
  80,
  '{"total":80,"engagement":26,"authenticity":22,"content_quality":20,"growth":12,"fake_follower_pct":7,"rationale":"engagement 6.9% สูงดีสำหรับ fitness account ผู้ติดตามปลอมต่ำ (7%) community มีคุณภาพ เนื้อหาครอบคลุมทั้ง workout และ nutrition ทำให้เหมาะกับแบรนด์ supplement, gym equipment, และ activewear"}'::jsonb,
  NOW() - INTERVAL '2 days'
),
(
  'yoga_with_bua',
  'tiktok',
  'บัว โยคะ',
  'Yoga & mindfulness สไตล์ไทย 🧘‍♀️ | สอนท่าพื้นฐาน ถึงขั้นสูง | เชียงใหม่ | online class available',
  68000, 820, 423,
  0.081,
  ARRAY['fitness', 'yoga', 'wellness'],
  'เชียงใหม่',
  'https://i.pravatar.cc/150?u=yoga_with_bua',
  'https://tiktok.com/@yoga_with_bua',
  83,
  '{"total":83,"engagement":28,"authenticity":24,"content_quality":19,"growth":12,"fake_follower_pct":3,"rationale":"TikTok engagement 8.1% สูงมาก ผู้ติดตามปลอมต่ำที่สุดในกลุ่ม fitness (3%) community มีความ engage สูง เนื้อหา yoga + wellness ดึงดูดกลุ่ม health-conscious เหมาะอย่างมากสำหรับแบรนด์ wellness, yoga mat, และ health supplement"}'::jsonb,
  NOW() - INTERVAL '1 day'
),
(
  'running_jib',
  'instagram',
  'จิ๊บ รันนิ่ง',
  'นักวิ่งสาว 🏃‍♀️ | ฝึกซ้อมมาราธอน, รีวิวรองเท้าวิ่ง | BKK runner community',
  43000, 1680, 356,
  0.057,
  ARRAY['fitness', 'running', 'sport'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=running_jib',
  'https://instagram.com/running_jib',
  73,
  '{"total":73,"engagement":23,"authenticity":23,"content_quality":16,"growth":11,"fake_follower_pct":4,"rationale":"engagement 5.7% ดีสำหรับ niche running ผู้ติดตามปลอมต่ำมาก (4%) แสดงถึงฐานแฟนที่แท้จริงในชุมชนนักวิ่ง เหมาะสำหรับแบรนด์รองเท้าวิ่ง, อุปกรณ์กีฬา, และ sports nutrition"}'::jsonb,
  NOW() - INTERVAL '7 days'
),
(
  'gymlife_dew',
  'youtube',
  'ดิ้ว ยิม',
  'Gym vlog & workout tutorials 🏋️ | สอนออกกำลังกายถูกวิธี | ดิ้ว ลาดพร้าว',
  32000, 590, 124,
  0.042,
  ARRAY['fitness', 'gym', 'bodybuilding'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=gymlife_dew',
  'https://youtube.com/@gymlife_dew',
  63,
  '{"total":63,"engagement":18,"authenticity":22,"content_quality":14,"growth":9,"fake_follower_pct":6,"rationale":"YouTube fitness channel ขนาดเล็กแต่มีความ authentic สูง ผู้ติดตามปลอมต่ำ (6%) เนื้อหา tutorial คุณภาพดี แต่จำนวนวิดีโอยังน้อย growth potential สูงหากสร้างเนื้อหาสม่ำเสมอ"}'::jsonb,
  NOW() - INTERVAL '5 days'
),

-- ── TRAVEL ────────────────────────────────────────────────────────────────────

(
  'wanderlust_aom',
  'instagram',
  'อ้อม วันเดอร์ลัสต์',
  'เที่ยวทั่วไทย ทั่วโลก ✈️ | hidden gems, budget travel, solo trip | อ้อม นักเดินทาง',
  133000, 2900, 748,
  0.054,
  ARRAY['travel', 'lifestyle', 'photography'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=wanderlust_aom',
  'https://instagram.com/wanderlust_aom',
  76,
  '{"total":76,"engagement":23,"authenticity":21,"content_quality":20,"growth":12,"fake_follower_pct":9,"rationale":"engagement 5.4% ดีสำหรับ travel account ขนาดนี้ ครอบคลุมทั้งในและนอกประเทศ เหมาะกับแบรนด์ hotel, airline, travel insurance, และ luggage ผู้ติดตามปลอมในระดับที่ยอมรับได้"}'::jsonb,
  NOW() - INTERVAL '3 days'
),
(
  'travelbug_per',
  'tiktok',
  'เปร เทรเวล',
  'ท่องเที่ยวภูเก็ตและอันดามัน 🏝️ | รีวิวรีสอร์ท, ที่กิน, กิจกรรม | เปร ภูเก็ต',
  196000, 960, 1024,
  0.101,
  ARRAY['travel', 'beach', 'resort'],
  'ภูเก็ต',
  'https://i.pravatar.cc/150?u=travelbug_per',
  'https://tiktok.com/@travelbug_per',
  91,
  '{"total":91,"engagement":30,"authenticity":23,"content_quality":23,"growth":15,"fake_follower_pct":3,"rationale":"TikTok engagement 10.1% สูงที่สุดในกลุ่มทั้งหมด ผู้ติดตามปลอมต่ำมาก (3%) เนื้อหา travel ภูเก็ตได้รับความนิยมสูงจากทั้งไทยและต่างชาติ เหมาะอย่างยิ่งสำหรับโรงแรม, ทัวร์, และแบรนด์ท่องเที่ยวอันดามัน"}'::jsonb,
  NOW() - INTERVAL '1 day'
),
(
  'backpack_nai',
  'youtube',
  'ไน แบ็คแพ็ค',
  'Backpacker สายประหยัด 🎒 | เที่ยวงบ 3000 บาท ได้จริง! | vlog ท่องเที่ยวทุกอาทิตย์',
  88000, 710, 231,
  0.045,
  ARRAY['travel', 'budget travel', 'vlog'],
  'กรุงเทพมหานคร',
  'https://i.pravatar.cc/150?u=backpack_nai',
  'https://youtube.com/@backpack_nai',
  71,
  '{"total":71,"engagement":20,"authenticity":22,"content_quality":18,"growth":11,"fake_follower_pct":8,"rationale":"YouTube travel vlog engagement 4.5% ดีสำหรับแพลตฟอร์ม เนื้อหา budget travel ดึงดูดกลุ่มคนหนุ่มสาวและนักท่องเที่ยวสายประหยัด เหมาะกับแบรนด์ hostel, bus/train booking, และ outdoor gear"}'::jsonb,
  NOW() - INTERVAL '4 days'
),
(
  'hidden_gem_tam',
  'instagram',
  'ต้ม ฮิดเดนเจม',
  'ค้นหาที่เที่ยวซ่อนเร้น เชียงราย และภาคเหนือ 🏔️ | ธรรมชาติ วัฒนธรรม วิถีชีวิต',
  73000, 1560, 512,
  0.073,
  ARRAY['travel', 'nature', 'culture'],
  'เชียงราย',
  'https://i.pravatar.cc/150?u=hidden_gem_tam',
  'https://instagram.com/hidden_gem_tam',
  79,
  '{"total":79,"engagement":26,"authenticity":22,"content_quality":19,"growth":12,"fake_follower_pct":7,"rationale":"engagement 7.3% สูงดีสำหรับ niche travel ภาคเหนือ เนื้อหา hidden gem มีความ unique สูงได้รับการ save และแชร์มาก เหมาะกับแบรนด์ที่ต้องการเข้าถึงตลาดนักท่องเที่ยวเชิงวัฒนธรรมและธรรมชาติ"}'::jsonb,
  NOW() - INTERVAL '2 days'
);

-- ── Verify ─────────────────────────────────────────────────────────────────────
SELECT
  username,
  platform,
  follower_count,
  avg_engagement_rate,
  talent_score,
  categories
FROM influencers
ORDER BY talent_score DESC NULLS LAST;
