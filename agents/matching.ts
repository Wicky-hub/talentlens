import type { AgentResult, CampaignMatch } from '@/types'
import { queryInfluencersByEmbedding } from '@/lib/pinecone/client'
import { createServiceClient } from '@/lib/supabase/server'

interface MatchingInput {
  campaignId: string
  influencerIds: string[]
  topK?: number
}

interface MatchingOutput {
  matches: CampaignMatch[]
}

export async function matchInfluencersToCampaign(
  input: MatchingInput,
): Promise<AgentResult<MatchingOutput>> {
  const start = Date.now()

  try {
    const supabase = await createServiceClient()

    // Load campaign to build a query embedding from its requirements
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', input.campaignId)
      .single()

    if (campaignError) throw new Error(campaignError.message)

    // Build a representative embedding from campaign criteria
    const dim = parseInt(process.env.PINECONE_EMBEDDING_DIMENSION ?? '1536', 10)
    const queryEmbedding = Array(dim).fill(0)
    queryEmbedding[0] = campaign.min_talent_score / 100
    queryEmbedding[2] = Math.min(
      (campaign.min_followers + campaign.max_followers) / 2 / 100_000,
      1,
    )

    const pineconeMatches = await queryInfluencersByEmbedding(
      queryEmbedding,
      input.topK ?? 10,
      { talent_score: { $gte: campaign.min_talent_score } },
    )

    // Filter to only influencers we just processed (if provided)
    const relevantMatches = input.influencerIds.length
      ? pineconeMatches.filter((m) => input.influencerIds.includes(m.id))
      : pineconeMatches

    // Persist matches
    const matchRows = relevantMatches.map((m) => ({
      campaign_id: input.campaignId,
      influencer_id: m.id,
      match_score: m.score ?? 0,
      status: 'pending' as const,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('campaign_matches')
      .upsert(matchRows, { onConflict: 'campaign_id,influencer_id' })
      .select()

    if (insertError) throw new Error(insertError.message)

    return {
      success: true,
      agent: 'matching',
      duration_ms: Date.now() - start,
      data: { matches: (inserted ?? []) as CampaignMatch[] },
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
