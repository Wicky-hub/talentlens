import type { AgentResult, OrchestratorInput, OrchestratorOutput, Campaign } from '@/types'
import { createServiceClient } from '@/lib/supabase/server'
import { collectInfluencerData } from './data-collector'
import { scoreInfluencer } from './scoring'
import { matchInfluencersToCampaign } from './matching'
import { generateReport } from './report'

function buildBrandBrief(campaign: Campaign): string {
  const lines = [
    `แคมเปญ: ${campaign.name}`,
    campaign.description,
    `หมวดหมู่เป้าหมาย: ${campaign.target_categories.join(', ')}`,
    `ผู้ติดตาม: ${campaign.min_followers.toLocaleString('th-TH')}–${campaign.max_followers.toLocaleString('th-TH')} คน`,
    `TalentScore ขั้นต่ำ: ${campaign.min_talent_score}`,
    `งบประมาณ: ${campaign.budget.toLocaleString('th-TH')} บาท`,
    campaign.target_location ? `พื้นที่: ${campaign.target_location}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}

export async function orchestrate(
  input: OrchestratorInput,
): Promise<AgentResult<OrchestratorOutput>> {
  const start = Date.now()

  try {
    const supabase = await createServiceClient()

    // Load campaign so we can derive a brand brief for the matching agent
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', input.campaignId)
      .single()

    if (campaignError) throw new Error(campaignError.message)

    // 1. Collect raw data for each URL
    const collected = await Promise.allSettled(
      input.influencerUrls.map((url) => collectInfluencerData(url)),
    )

    const successfulProfiles = collected
      .filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof collectInfluencerData>>> =>
          r.status === 'fulfilled' && r.value.success,
      )
      .map((r) => r.value.data!)

    // 2. Score each collected profile (also upserts embeddings to Pinecone)
    const scored = await Promise.allSettled(
      successfulProfiles.map((profile) => scoreInfluencer(profile)),
    )

    const scoredCount = scored.filter(
      (r) => r.status === 'fulfilled' && r.value.success,
    ).length

    // 3. Match against the campaign using a Thai brief derived from campaign data
    const brandBrief = buildBrandBrief(campaign as Campaign)
    const matchResult = await matchInfluencersToCampaign({
      brandBrief,
      campaignId: input.campaignId,
    })

    // 4. Generate a report for the top match
    const topMatch = matchResult.data?.matches[0]
    let reportGenerated = false
    if (topMatch) {
      const reportResult = await generateReport({
        campaignId: input.campaignId,
        influencerId: topMatch.influencer.id,
      })
      reportGenerated = reportResult.success
    }

    return {
      success: true,
      agent: 'orchestrator',
      duration_ms: Date.now() - start,
      data: {
        collected: successfulProfiles.length,
        scored: scoredCount,
        matched: matchResult.data?.matches.length ?? 0,
        reportGenerated,
      },
    }
  } catch (error) {
    return {
      success: false,
      agent: 'orchestrator',
      duration_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
