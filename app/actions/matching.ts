'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaudeClient, MODEL } from '@/lib/claude/client'
import type { Campaign, Influencer, AIMatchResult, CampaignInfluencerStatus } from '@/types'

// ─── Return types ─────────────────────────────────────────────────────────────

export type MatchingActionResult = {
  matches?: AIMatchResult[]
  error?: string
}

export type SimpleResult = { error?: string }

// ─── Run AI Matching ──────────────────────────────────────────────────────────

export async function runAIMatchingAction(
  campaignId: string,
): Promise<MatchingActionResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อน' }

  // Load campaign and verify ownership
  const { data: campaignRow } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('sme_id', user.id)
    .single()
  if (!campaignRow) return { error: 'ไม่พบแคมเปญ หรือคุณไม่มีสิทธิ์เข้าถึง' }

  const campaign = campaignRow as Campaign

  // Load candidate influencers (filtered by platform, top 30 by talent_score)
  let infQuery = supabase
    .from('influencers')
    .select('*')
    .order('talent_score', { ascending: false })
    .limit(30)
  if (campaign.target_platforms?.length > 0) {
    infQuery = infQuery.in('platform', campaign.target_platforms)
  }
  const { data: infData } = await infQuery
  if (!infData?.length) return { error: 'ไม่มีข้อมูล influencer ในระบบ' }

  const influencers = infData as Influencer[]

  // Compact influencer payload for prompt
  const infList = influencers.map((inf) => ({
    id: inf.id,
    username: inf.username,
    platform: inf.platform,
    display_name: inf.display_name,
    follower_count: inf.follower_count,
    avg_engagement_rate: Number(inf.avg_engagement_rate.toFixed(4)),
    categories: inf.categories,
    talent_score: inf.talent_score,
    price_per_post: inf.price_per_post ?? 0,
    fake_follower_pct: inf.talent_score_breakdown?.fake_follower_pct ?? null,
  }))

  const prompt = `คุณคือระบบ AI สำหรับจับคู่ micro-influencer ชาวไทยกับแคมเปญของ SME

รายละเอียดแคมเปญ:
- ชื่อแคมเปญ: ${campaign.name}
- แบรนด์: ${campaign.brand ?? '-'}
- Brief / รายละเอียด: ${campaign.description || 'ไม่มี brief'}
- งบประมาณ: ฿${Number(campaign.budget).toLocaleString('th-TH')} บาท
- แพลตฟอร์มเป้าหมาย: ${campaign.target_platforms?.join(', ') || 'ทุกแพลตฟอร์ม'}
- หมวดหมู่เป้าหมาย: ${campaign.target_categories?.join(', ') || 'ทุกหมวดหมู่'}

รายชื่อ Influencer ที่มีในระบบ (${infList.length} คน):
${JSON.stringify(infList, null, 2)}

คำแนะนำ:
1. วิเคราะห์ความเหมาะสมของ influencer แต่ละคนกับแคมเปญ
2. พิจารณา: TalentScore, engagement rate, categories ที่ตรงกับ brief, ราคา vs งบประมาณ, fake_follower_pct ต่ำ = น่าเชื่อถือ
3. คัดเลือก TOP 5 ที่เหมาะสมที่สุด เรียงจากคะแนนสูงไปต่ำ
4. คำนวณ estimated_reach = Math.round(follower_count * avg_engagement_rate * 8)
5. เขียน reasoning เป็นภาษาไทย 2-3 ประโยค อธิบายชัดเจนว่าทำไมถึงเหมาะสม

ตอบกลับด้วย JSON array เท่านั้น ไม่มีข้อความอื่น ไม่ใช้ markdown code block:
[{"influencer_id":"uuid","match_score":87,"reasoning":"เหตุผลภาษาไทย...","estimated_reach":52000,"roi_estimate":"คาดเข้าถึง 52,000 คน คุ้มค่างบประมาณ"}]`

  try {
    const claude = getClaudeClient()
    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    // Extract JSON array from response text
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return { error: 'AI ส่งข้อมูลผิดรูปแบบ กรุณาลองใหม่' }

    type RawMatch = {
      influencer_id: string
      match_score: number
      reasoning: string
      estimated_reach: number
      roi_estimate: string
    }
    const rawMatches = JSON.parse(jsonMatch[0]) as RawMatch[]

    const infMap = new Map(influencers.map((inf) => [inf.id, inf]))
    const matches: AIMatchResult[] = rawMatches
      .slice(0, 5)
      .filter((m) => infMap.has(m.influencer_id))
      .map((m) => ({ ...m, influencer: infMap.get(m.influencer_id) }))

    return { matches }
  } catch (err) {
    return {
      error: `เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

// ─── Add influencer to campaign ───────────────────────────────────────────────

export async function addInfluencerToCampaignAction(
  campaignId: string,
  influencerId: string,
  data: { match_score: number; ai_reasoning: string; estimated_reach: number },
): Promise<SimpleResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อน' }

  // Verify ownership
  const { data: own } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('sme_id', user.id)
    .single()
  if (!own) return { error: 'ไม่มีสิทธิ์เข้าถึงแคมเปญนี้' }

  const { error } = await supabase.from('campaign_influencers').upsert(
    {
      campaign_id: campaignId,
      influencer_id: influencerId,
      match_score: data.match_score,
      ai_reasoning: data.ai_reasoning,
      estimated_reach: data.estimated_reach,
      status: 'pending',
    },
    { onConflict: 'campaign_id,influencer_id' },
  )

  if (error) return { error: error.message }
  revalidatePath(`/campaigns/${campaignId}`)
  return {}
}

// ─── Update influencer status ─────────────────────────────────────────────────

export async function updateCampaignInfluencerStatusAction(
  id: string,
  status: string,
  campaignId: string,
): Promise<SimpleResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อน' }

  const VALID: CampaignInfluencerStatus[] = ['pending', 'contacted', 'confirmed', 'rejected']
  if (!VALID.includes(status as CampaignInfluencerStatus)) return { error: 'สถานะไม่ถูกต้อง' }

  const validStatus = status as CampaignInfluencerStatus

  // Verify ownership via campaign
  const { data: own } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('sme_id', user.id)
    .single()
  if (!own) return { error: 'ไม่มีสิทธิ์เข้าถึงแคมเปญนี้' }

  const { error } = await supabase
    .from('campaign_influencers')
    .update({ status: validStatus })
    .eq('id', id)
    .eq('campaign_id', campaignId)

  if (error) return { error: error.message }
  revalidatePath(`/campaigns/${campaignId}`)
  return {}
}
