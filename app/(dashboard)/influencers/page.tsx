import { createServerClient } from '@/lib/supabase/server'
import type { Influencer } from '@/types'

export default async function InfluencersPage() {
  const supabase = await createServerClient()
  const { data: influencers } = await supabase
    .from('influencers')
    .select('*')
    .order('talent_score', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ค้นหาอินฟลูเอนเซอร์</h1>
      </div>
      {/* InfluencerGrid component goes here */}
      <pre className="text-xs text-muted-foreground">
        {JSON.stringify(influencers?.length ?? 0)} รายการ
      </pre>
    </div>
  )
}
