export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook'
export type CampaignStatus = 'draft' | 'active' | 'completed'
export type MatchStatus = 'pending' | 'approved' | 'rejected'

export interface Influencer {
  id: string
  username: string
  platform: Platform
  display_name: string
  bio: string
  follower_count: number
  following_count: number
  post_count: number
  avg_engagement_rate: number
  categories: string[]
  location: string
  profile_image_url: string
  profile_url: string
  price_per_post: number
  talent_score: number | null
  talent_score_breakdown: TalentScoreBreakdown | null
  apify_actor_run_id: string | null
  last_scraped_at: string | null
  created_at: string
  updated_at: string
}

export interface TalentScoreBreakdown {
  total: number           // 0–100 composite
  engagement: number      // 0–30
  authenticity: number    // 0–25
  content_quality: number // 0–25
  growth: number          // 0–20
  fake_follower_pct: number // estimated 0–100
  rationale: string       // Thai-language explanation
}

export interface SME {
  id: string
  user_id: string
  business_name: string
  industry: string
  description: string
  website_url: string | null
  logo_url: string | null
  created_at: string
}

export interface Campaign {
  id: string
  sme_id: string
  name: string
  description: string
  brand: string | null
  budget: number
  target_categories: string[]
  target_platforms: Platform[]
  target_location: string | null
  start_date: string | null
  end_date: string | null
  min_followers: number
  max_followers: number
  min_talent_score: number
  status: CampaignStatus
  created_at: string
  updated_at: string
}

export interface CampaignMatch {
  id: string
  campaign_id: string
  influencer_id: string
  match_score: number   // 0–1 cosine similarity from Pinecone
  status: MatchStatus
  matched_at: string
  influencer?: Influencer
}

export interface Report {
  id: string
  campaign_id: string
  influencer_id: string
  content: string       // Thai-language markdown from Report Agent
  created_at: string
}

// ─── Agent I/O ───────────────────────────────────────────────────────────────

export interface AgentResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  agent: string
  duration_ms: number
}

export interface OrchestratorInput {
  campaignId: string
  influencerUrls: string[]
}

export interface OrchestratorOutput {
  collected: number
  scored: number
  matched: number
  reportGenerated: boolean
}
