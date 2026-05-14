import type { AgentResult, Influencer, TalentScoreBreakdown } from '@/types'
import { getClaudeClient, MODEL } from '@/lib/claude/client'
import { createServiceClient } from '@/lib/supabase/server'
import { upsertInfluencerEmbedding } from '@/lib/pinecone/client'

// ─── Scoring weights (must sum to 100) ────────────────────────────────────────
const WEIGHTS = { engagement: 30, authenticity: 25, content_quality: 25, growth: 20 } as const

// Expected organic engagement baseline for Thai micro-influencers
const ORGANIC_ENGAGEMENT_BASELINE = 0.035

// ─── Fake follower detection ───────────────────────────────────────────────────

/**
 * Estimates fake follower % using three signals:
 *   1. Engagement deficit vs organic baseline (60 % weight) — the strongest proxy.
 *      An account with N% fake followers effectively dilutes engagement by N%.
 *   2. Following-to-follower ratio anomaly (30 % weight) — bought followers rarely
 *      reciprocate, so a high ratio flags follow-for-follow or purchased audiences.
 *   3. Post scarcity vs follower count (10 % weight) — few posts + large audience
 *      is a common purchased-account pattern.
 */
function estimateFakeFollowerPct(influencer: Influencer): number {
  const { avg_engagement_rate, follower_count, following_count, post_count } = influencer

  const engagementDeficit = Math.max(0, 1 - avg_engagement_rate / ORGANIC_ENGAGEMENT_BASELINE)

  const followRatio = following_count / Math.max(follower_count, 1)
  const followSignal = Math.min(followRatio * 0.3, 0.3)

  const postsPerFollower = post_count / Math.max(follower_count, 1)
  const activitySignal = postsPerFollower < 0.001 ? 0.15 : 0

  const raw = engagementDeficit * 0.6 + followSignal * 0.3 + activitySignal * 0.1
  // Cap at 95 — we can never be certain without platform-level data
  return Math.round(Math.min(raw * 100, 95))
}

function fakeFollowerRiskLabel(pct: number): string {
  if (pct >= 50) return 'สูงมาก'
  if (pct >= 30) return 'สูง'
  if (pct >= 15) return 'ปานกลาง'
  if (pct >= 5) return 'ต่ำ'
  return 'ต่ำมาก'
}

// ─── Sub-dimension scorers ─────────────────────────────────────────────────────

function scoreEngagement(rate: number): number {
  // Micro-influencer sweet spot: 3–8% engagement
  if (rate >= 0.08) return 30
  if (rate >= 0.05) return 25
  if (rate >= 0.03) return 20
  if (rate >= 0.01) return 12
  return 5
}

function scoreAuthenticity(
  followerCount: number,
  followingCount: number,
  fakePct: number,
): number {
  const ratio = followerCount / Math.max(followingCount, 1)
  const base = ratio >= 10 ? 25 : ratio >= 5 ? 20 : ratio >= 2 ? 15 : ratio >= 1 ? 10 : 5
  // Proportional penalty: fake followers dilute the authenticity score
  const penalty = Math.round((fakePct / 100) * base)
  return Math.max(base - penalty, 0)
}

function scoreContentQuality(postCount: number): number {
  if (postCount >= 500) return 25
  if (postCount >= 200) return 20
  if (postCount >= 100) return 15
  if (postCount >= 50) return 10
  return 5
}

function scoreGrowth(followerCount: number): number {
  // Micro-influencer range: 1K–100K
  if (followerCount >= 50_000) return 20
  if (followerCount >= 20_000) return 16
  if (followerCount >= 10_000) return 12
  if (followerCount >= 1_000) return 8
  return 4
}

// ─── Thai rationale via Claude ─────────────────────────────────────────────────

async function generateRationale(
  influencer: Influencer,
  breakdown: Omit<TalentScoreBreakdown, 'rationale'>,
): Promise<string> {
  const claude = getClaudeClient()
  const riskLabel = fakeFollowerRiskLabel(breakdown.fake_follower_pct)
  const highRiskNote =
    breakdown.fake_follower_pct >= 30
      ? '\nเน้นความเสี่ยงของผู้ติดตามปลอมและแนะนำให้แบรนด์ตรวจสอบเพิ่มเติมก่อนร่วมงาน'
      : ''

  const response = await claude.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `วิเคราะห์ผล TalentScore ของ @${influencer.username} (${influencer.platform}) เป็นภาษาไทย ไม่เกิน 4 ประโยค:
- คะแนนรวม: ${breakdown.total}/100
- Engagement: ${breakdown.engagement}/${WEIGHTS.engagement} (อัตราจริง ${(influencer.avg_engagement_rate * 100).toFixed(2)}%)
- ความน่าเชื่อถือ: ${breakdown.authenticity}/${WEIGHTS.authenticity}
- คุณภาพคอนเทนต์: ${breakdown.content_quality}/${WEIGHTS.content_quality}
- การเติบโต: ${breakdown.growth}/${WEIGHTS.growth}
- ผู้ติดตาม: ${influencer.follower_count.toLocaleString('th-TH')} คน
- ประมาณการผู้ติดตามปลอม: ${breakdown.fake_follower_pct}% (ระดับความเสี่ยง: ${riskLabel})${highRiskNote}`,
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

// ─── Main export ───────────────────────────────────────────────────────────────

export async function scoreInfluencer(influencer: Influencer): Promise<AgentResult<Influencer>> {
  const start = Date.now()

  try {
    const fake_follower_pct = estimateFakeFollowerPct(influencer)
    const engagement = scoreEngagement(influencer.avg_engagement_rate)
    const authenticity = scoreAuthenticity(
      influencer.follower_count,
      influencer.following_count,
      fake_follower_pct,
    )
    const content_quality = scoreContentQuality(influencer.post_count)
    const growth = scoreGrowth(influencer.follower_count)
    const total = engagement + authenticity + content_quality + growth

    const rationale = await generateRationale(influencer, {
      total,
      engagement,
      authenticity,
      content_quality,
      growth,
      fake_follower_pct,
    })

    const breakdown: TalentScoreBreakdown = {
      total,
      engagement,
      authenticity,
      content_quality,
      growth,
      fake_follower_pct,
      rationale,
    }

    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('influencers')
      .update({ talent_score: total, talent_score_breakdown: breakdown })
      .eq('id', influencer.id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    const dim = parseInt(process.env.PINECONE_EMBEDDING_DIMENSION ?? '1536', 10)
    const embedding = Array(dim).fill(0)
    embedding[0] = total / 100
    embedding[1] = influencer.avg_engagement_rate
    embedding[2] = Math.min(influencer.follower_count / 100_000, 1)
    // Authenticity signal so the matching agent can bias toward genuine accounts
    embedding[3] = 1 - fake_follower_pct / 100

    await upsertInfluencerEmbedding(influencer.id, embedding, {
      platform: influencer.platform,
      talent_score: total,
      follower_count: influencer.follower_count,
      fake_follower_pct,
    })

    return { success: true, agent: 'scoring', duration_ms: Date.now() - start, data: data as Influencer }
  } catch (error) {
    return {
      success: false,
      agent: 'scoring',
      duration_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
