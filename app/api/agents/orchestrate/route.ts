import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { orchestrate } from '@/agents/orchestrator'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as { campaignId: string; influencerUrls: string[] }

  if (!body.campaignId || !body.influencerUrls?.length) {
    return NextResponse.json({ error: 'campaignId and influencerUrls are required' }, { status: 400 })
  }

  const result = await orchestrate({
    campaignId: body.campaignId,
    influencerUrls: body.influencerUrls,
  })

  return NextResponse.json(result)
}
