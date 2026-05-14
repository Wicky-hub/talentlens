import Anthropic from '@anthropic-ai/sdk'
import type { AgentResult, Influencer, Platform } from '@/types'
import { getClaudeClient, MODEL } from '@/lib/claude/client'
import { createServiceClient } from '@/lib/supabase/server'
import { queryInfluencersByEmbedding } from '@/lib/pinecone/client'

// ─── I/O types ────────────────────────────────────────────────────────────────

export interface MatchingInput {
  brandBrief: string   // Thai-language brand brief
  campaignId?: string  // if set, matches are persisted to campaign_matches
  topK?: number        // default 10, max 20
}

export interface MatchedInfluencer {
  influencer: Influencer
  match_score: number      // 0–1 cosine similarity from Pinecone
  match_reason: string     // Thai-language reasoning from Claude
  campaign_match_id?: string
}

export interface MatchingOutput {
  matches: MatchedInfluencer[]
  brief_summary: string    // Thai summary of extracted criteria
  total_candidates: number // Pinecone hits before slicing to topK
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface BriefCriteria {
  platforms?: Platform[]
  min_followers?: number
  max_followers?: number
  min_talent_score?: number
  categories?: string[]
  location?: string
  budget?: number
  key_requirements?: string[]
  brief_summary: string
}

interface MatchReason {
  influencer_id: string
  reason: string
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_brief_criteria',
  description: 'แยกเกณฑ์การคัดเลือกอินฟลูเอนเซอร์จาก brand brief ภาษาไทย',
  input_schema: {
    type: 'object',
    properties: {
      platforms: {
        type: 'array',
        items: { type: 'string', enum: ['instagram', 'tiktok', 'youtube', 'facebook'] },
        description: 'แพลตฟอร์มที่ต้องการ ระบุทุกแพลตฟอร์มที่กล่าวถึง',
      },
      min_followers: { type: 'number', description: 'จำนวนผู้ติดตามขั้นต่ำ' },
      max_followers: { type: 'number', description: 'จำนวนผู้ติดตามสูงสุด' },
      min_talent_score: {
        type: 'number',
        description: 'TalentScore ขั้นต่ำ (0-100) ถ้าไม่ระบุให้ใช้ 50',
      },
      categories: {
        type: 'array',
        items: { type: 'string' },
        description: 'หมวดหมู่เนื้อหา เช่น อาหาร ความงาม แฟชั่น ท่องเที่ยว ไลฟ์สไตล์',
      },
      location: { type: 'string', description: 'จังหวัดหรือพื้นที่เป้าหมาย' },
      budget: { type: 'number', description: 'งบประมาณรวมในบาท' },
      key_requirements: {
        type: 'array',
        items: { type: 'string' },
        description: 'ข้อกำหนดสำคัญอื่นๆ ที่ไม่ใช่ตัวเลข',
      },
      brief_summary: {
        type: 'string',
        description: 'สรุปเกณฑ์การค้นหาเป็นภาษาไทย 1–2 ประโยค',
      },
    },
    required: ['brief_summary'],
  },
}

const REASON_TOOL: Anthropic.Tool = {
  name: 'record_match_reasons',
  description: 'บันทึกเหตุผลการจับคู่อินฟลูเอนเซอร์กับแบรนด์เป็นภาษาไทย',
  input_schema: {
    type: 'object',
    properties: {
      matches: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            influencer_id: { type: 'string' },
            reason: {
              type: 'string',
              description:
                'เหตุผล 2–3 ประโยคเป็นภาษาไทย อธิบายว่าทำไมอินฟลูเอนเซอร์คนนี้เหมาะกับแบรนด์' +
                ' โดยอ้างอิงตัวเลขจริงจากโปรไฟล์',
            },
          },
          required: ['influencer_id', 'reason'],
        },
      },
    },
    required: ['matches'],
  },
}

// ─── Step 1: Extract structured criteria from Thai brief ──────────────────────

async function extractCriteria(brief: string): Promise<BriefCriteria> {
  const claude = getClaudeClient()
  const response = await claude.messages.create({
    model: MODEL,
    max_tokens: 600,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: 'tool', name: EXTRACT_TOOL.name },
    messages: [
      {
        role: 'user',
        content: `วิเคราะห์ brand brief นี้และแยกเกณฑ์การคัดเลือกอินฟลูเอนเซอร์:\n\n${brief}`,
      },
    ],
  })

  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
  if (!toolUse) throw new Error('Claude did not return criteria extraction tool result')

  return toolUse.input as BriefCriteria
}

// ─── Step 2: Build Pinecone query vector ──────────────────────────────────────
//
// Mirrors the embedding layout from the Scoring Agent:
//   [0] = talent_score / 100
//   [1] = avg_engagement_rate
//   [2] = follower_count / 100_000  (capped at 1)
//   [3] = 1 - fake_follower_pct / 100

function buildQueryEmbedding(criteria: BriefCriteria, dim: number): number[] {
  const embedding = Array<number>(dim).fill(0)

  embedding[0] = (criteria.min_talent_score ?? 60) / 100

  // Target engagement near the micro-influencer sweet spot
  embedding[1] = 0.04

  // Midpoint of the requested follower range
  const midFollowers =
    ((criteria.min_followers ?? 5_000) + (criteria.max_followers ?? 50_000)) / 2
  embedding[2] = Math.min(midFollowers / 100_000, 1)

  // Prefer genuine audiences (low fake-follower %)
  embedding[3] = 0.85

  return embedding
}

// ─── Step 3: Pinecone metadata filter ─────────────────────────────────────────

function buildFilter(criteria: BriefCriteria): Record<string, unknown> | undefined {
  const filter: Record<string, unknown> = {}

  if (criteria.platforms?.length) {
    filter.platform = { $in: criteria.platforms }
  }

  if (criteria.min_talent_score !== undefined) {
    filter.talent_score = { $gte: criteria.min_talent_score }
  }

  const hasMin = criteria.min_followers !== undefined
  const hasMax = criteria.max_followers !== undefined
  if (hasMin || hasMax) {
    const fc: Record<string, number> = {}
    if (hasMin) fc.$gte = criteria.min_followers!
    if (hasMax) fc.$lte = criteria.max_followers!
    filter.follower_count = fc
  }

  return Object.keys(filter).length ? filter : undefined
}

// ─── Step 4: Fetch full influencer profiles from Supabase ────────────────────

async function fetchProfiles(ids: string[]): Promise<Map<string, Influencer>> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('influencers').select('*').in('id', ids)
  if (error) throw new Error(error.message)
  return new Map((data as Influencer[]).map((inf) => [inf.id, inf]))
}

// ─── Step 5: Generate Thai reasoning for all matches (single Claude call) ────

async function generateReasonings(
  brief: string,
  criteria: BriefCriteria,
  candidates: Array<{ influencer: Influencer; match_score: number }>,
): Promise<Map<string, string>> {
  const claude = getClaudeClient()

  const profileList = candidates
    .map(
      ({ influencer: inf, match_score }, i) =>
        `${i + 1}. ID: ${inf.id} | @${inf.username} (${inf.platform})
   ผู้ติดตาม: ${inf.follower_count.toLocaleString('th-TH')} คน | Engagement: ${(inf.avg_engagement_rate * 100).toFixed(2)}%
   TalentScore: ${inf.talent_score ?? 'ยังไม่มีคะแนน'}/100 | ความคล้ายคลึง: ${(match_score * 100).toFixed(1)}%
   หมวดหมู่: ${inf.categories.join(', ') || 'ไม่ระบุ'}
   ผู้ติดตามปลอม (ประมาณ): ${inf.talent_score_breakdown?.fake_follower_pct ?? 'ไม่ทราบ'}%`,
    )
    .join('\n\n')

  const response = await claude.messages.create({
    model: MODEL,
    max_tokens: 1200,
    tools: [REASON_TOOL],
    tool_choice: { type: 'tool', name: REASON_TOOL.name },
    messages: [
      {
        role: 'user',
        content: `แบรนด์ต้องการอินฟลูเอนเซอร์ตาม brief นี้:

"${brief}"

เกณฑ์ที่ระบบระบุได้: ${criteria.brief_summary}

อินฟลูเอนเซอร์ที่ผ่านการคัดเลือก (เรียงตามคะแนนความเหมาะสม):
${profileList}

เขียนเหตุผล 2–3 ประโยคเป็นภาษาไทยสำหรับแต่ละคน อธิบายว่าทำไมเหมาะกับแบรนด์นี้ โดยอ้างอิงตัวเลขจริงจากโปรไฟล์`,
      },
    ],
  })

  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
  if (!toolUse) return new Map()

  const { matches } = toolUse.input as { matches: MatchReason[] }
  return new Map(matches.map((m) => [m.influencer_id, m.reason]))
}

// ─── Step 6: Persist to campaign_matches ──────────────────────────────────────

async function persistMatches(
  campaignId: string,
  candidates: Array<{ influencer: Influencer; match_score: number }>,
): Promise<Map<string, string>> {
  const supabase = await createServiceClient()
  const rows = candidates.map(({ influencer, match_score }) => ({
    campaign_id: campaignId,
    influencer_id: influencer.id,
    match_score,
    status: 'pending' as const,
  }))

  const { data, error } = await supabase
    .from('campaign_matches')
    .upsert(rows, { onConflict: 'campaign_id,influencer_id' })
    .select('id, influencer_id')

  if (error) throw new Error(error.message)

  return new Map(
    (data ?? []).map((row) => [row.influencer_id as string, row.id as string]),
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────

export async function matchInfluencersToCampaign(
  input: MatchingInput,
): Promise<AgentResult<MatchingOutput>> {
  const start = Date.now()

  try {
    const { brandBrief, campaignId, topK = 10 } = input
    const clampedTopK = Math.min(topK, 20)

    // 1. Extract structured criteria from the Thai brief
    const criteria = await extractCriteria(brandBrief)

    // 2. Query Pinecone — fetch 2× topK so re-ranking has headroom
    const dim = parseInt(process.env.PINECONE_EMBEDDING_DIMENSION ?? '1536', 10)
    const queryEmbedding = buildQueryEmbedding(criteria, dim)
    const filter = buildFilter(criteria)
    const hits = await queryInfluencersByEmbedding(queryEmbedding, clampedTopK * 2, filter)

    if (!hits.length) {
      return {
        success: true,
        agent: 'matching',
        duration_ms: Date.now() - start,
        data: { matches: [], brief_summary: criteria.brief_summary, total_candidates: 0 },
      }
    }

    // 3. Fetch full profiles from Supabase
    const profileMap = await fetchProfiles(hits.map((h) => h.id))
    const candidates = hits
      .filter((h) => profileMap.has(h.id))
      .map((h) => ({ influencer: profileMap.get(h.id)!, match_score: h.score ?? 0 }))
      .slice(0, clampedTopK)

    // 4. Generate Thai reasoning for all candidates in one Claude call
    const reasonings = await generateReasonings(brandBrief, criteria, candidates)

    // 5. Persist matches if campaignId provided
    const dbIdMap = campaignId
      ? await persistMatches(campaignId, candidates)
      : new Map<string, string>()

    // 6. Assemble output
    const matches: MatchedInfluencer[] = candidates.map(({ influencer, match_score }) => ({
      influencer,
      match_score,
      match_reason: reasonings.get(influencer.id) ?? 'ไม่สามารถระบุเหตุผลได้',
      ...(dbIdMap.has(influencer.id) && { campaign_match_id: dbIdMap.get(influencer.id) }),
    }))

    return {
      success: true,
      agent: 'matching',
      duration_ms: Date.now() - start,
      data: { matches, brief_summary: criteria.brief_summary, total_candidates: hits.length },
    }
  } catch (error) {
    return {
      success: false,
      agent: 'matching',
      duration_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
