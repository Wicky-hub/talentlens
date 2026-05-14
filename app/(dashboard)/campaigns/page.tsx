import { createServerClient } from '@/lib/supabase/server'

export default async function CampaignsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, smes(business_name)')
    .eq('smes.user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">แคมเปญของฉัน</h1>
      </div>
      {/* CampaignList component goes here */}
    </div>
  )
}
