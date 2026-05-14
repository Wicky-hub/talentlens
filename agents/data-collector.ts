import type { AgentResult, Influencer, Platform } from '@/types'
import { createServiceClient } from '@/lib/supabase/server'

interface ApifyRunResult {
  username: string
  fullName: string
  biography: string
  followersCount: number
  followsCount: number
  postsCount: number
  profilePicUrl: string
  url: string
  latestPosts?: Array<{ likesCount: number; commentsCount: number }>
}

function detectPlatform(url: string): Platform {
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  return 'facebook'
}

function getActorId(platform: Platform): string {
  const map: Record<Platform, string> = {
    instagram: process.env.APIFY_INSTAGRAM_ACTOR_ID!,
    tiktok: process.env.APIFY_TIKTOK_ACTOR_ID!,
    youtube: process.env.APIFY_YOUTUBE_ACTOR_ID!,
    facebook: process.env.APIFY_INSTAGRAM_ACTOR_ID!, // fallback
  }
  return map[platform]
}

function calcEngagementRate(posts: ApifyRunResult['latestPosts'], followers: number): number {
  if (!posts?.length || followers === 0) return 0
  const avgInteractions =
    posts.reduce((sum, p) => sum + p.likesCount + p.commentsCount, 0) / posts.length
  return avgInteractions / followers
}

export async function collectInfluencerData(profileUrl: string): Promise<AgentResult<Influencer>> {
  const start = Date.now()

  try {
    const platform = detectPlatform(profileUrl)
    const actorId = getActorId(platform)

    // Trigger Apify actor run
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${process.env.APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startUrls: [{ url: profileUrl }], resultsLimit: 1 }),
      },
    )

    if (!runRes.ok) {
      throw new Error(`Apify error: ${runRes.status} ${runRes.statusText}`)
    }

    const items = (await runRes.json()) as ApifyRunResult[]
    const raw = items[0]
    if (!raw) throw new Error('Apify returned no results for this URL')

    const engagementRate = calcEngagementRate(raw.latestPosts, raw.followersCount)

    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('influencers')
      .upsert(
        {
          username: raw.username,
          platform,
          display_name: raw.fullName,
          bio: raw.biography,
          follower_count: raw.followersCount,
          following_count: raw.followsCount,
          post_count: raw.postsCount,
          avg_engagement_rate: engagementRate,
          categories: [],
          location: '',
          profile_image_url: raw.profilePicUrl,
          profile_url: raw.url,
          last_scraped_at: new Date().toISOString(),
        },
        { onConflict: 'username,platform' },
      )
      .select()
      .single()

    if (error) throw new Error(error.message)

    return { success: true, agent: 'data-collector', duration_ms: Date.now() - start, data: data as Influencer }
  } catch (error) {
    return {
      success: false,
      agent: 'data-collector',
      duration_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
