import type { AgentResult, OrchestratorInput, OrchestratorOutput } from '@/types'
import { collectInfluencerData } from './data-collector'
import { scoreInfluencer } from './scoring'
import { matchInfluencersToCampaign } from './matching'
import { generateReport } from './report'

export async function orchestrate(
  input: OrchestratorInput,
): Promise<AgentResult<OrchestratorOutput>> {
  const start = Date.now()

  try {
    // 1. Collect raw data for each URL
    const collected = await Promise.allSettled(
      input.influencerUrls.map((url) => collectInfluencerData(url)),
    )

    const successfulProfiles = collected
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof collectInfluencerData>>> =>
        r.status === 'fulfilled' && r.value.success,
      )
      .map((r) => r.value.data!)

    // 2. Score each collected profile
    const scored = await Promise.allSettled(
      successfulProfiles.map((profile) => scoreInfluencer(profile)),
    )

    const scoredProfiles = scored
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof scoreInfluencer>>> =>
        r.status === 'fulfilled' && r.value.success,
      )
      .map((r) => r.value.data!)

    // 3. Match against the campaign
    const matchResult = await matchInfluencersToCampaign({
      campaignId: input.campaignId,
      influencerIds: scoredProfiles.map((p) => p.id),
    })

    // 4. Generate a report for the top match
    const topMatch = matchResult.data?.matches[0]
    let reportGenerated = false
    if (topMatch) {
      const reportResult = await generateReport({
        campaignId: input.campaignId,
        influencerId: topMatch.influencer_id,
      })
      reportGenerated = reportResult.success
    }

    return {
      success: true,
      agent: 'orchestrator',
      duration_ms: Date.now() - start,
      data: {
        collected: successfulProfiles.length,
        scored: scoredProfiles.length,
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
