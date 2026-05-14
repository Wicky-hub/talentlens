import { createServerClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const [{ count: influencerCount }, { count: campaignCount }] = await Promise.all([
    supabase.from('influencers').select('*', { count: 'exact', head: true }),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ภาพรวม</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="อินฟลูเอนเซอร์ทั้งหมด" value={influencerCount ?? 0} />
        <StatCard label="แคมเปญที่ใช้งานอยู่" value={campaignCount ?? 0} />
        <StatCard label="การจับคู่เสร็จสิ้น" value={0} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value.toLocaleString('th-TH')}</p>
    </div>
  )
}
