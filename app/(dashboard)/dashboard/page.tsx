import Link from 'next/link'
import {
  Users,
  Megaphone,
  Target,
  Star,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import type { Influencer, Campaign, CampaignStatus, Platform } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getLocale } from '@/lib/locale'
import { getTranslation } from '@/lib/i18n'
import { InfluencerAvatar } from '@/components/dashboard/influencer-avatar'

// Always render fresh — never use a cached response from build time.
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [locale, supabase] = await Promise.all([getLocale(), createServerClient()])
  const t = getTranslation(locale)

  const [
    r_influencers,
    r_activeCampaigns,
    r_matches,
    r_scores,
    r_topInfluencers,
    r_recentCampaigns,
    r_matchIds,
  ] = await Promise.all([
    supabase.from('influencers').select('*', { count: 'exact', head: true }),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('campaign_matches').select('*', { count: 'exact', head: true }),
    supabase.from('influencers').select('talent_score').not('talent_score', 'is', null),
    supabase
      .from('influencers')
      .select('*')
      .not('talent_score', 'is', null)
      .order('talent_score', { ascending: false })
      .limit(5),
    supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('campaign_matches').select('campaign_id'),
  ])

  // Log any Supabase errors to the server console / Vercel logs for debugging.
  const queryLabels = [
    'influencers:count', 'campaigns:active:count', 'matches:count',
    'influencers:scores', 'influencers:top5', 'campaigns:recent5', 'matches:ids',
  ]
  ;[r_influencers, r_activeCampaigns, r_matches, r_scores, r_topInfluencers, r_recentCampaigns, r_matchIds]
    .forEach((r, i) => {
      if (r.error) {
        console.error(`[dashboard] ${queryLabels[i]} — ${r.error.code}: ${r.error.message}`)
      }
    })

  const { count: influencerCount }    = r_influencers
  const { count: activeCampaignCount } = r_activeCampaigns
  const { count: matchCount }          = r_matches
  const { data: scoreRows }            = r_scores
  const { data: topInfluencerData }    = r_topInfluencers
  const { data: recentCampaignData }   = r_recentCampaigns
  const { data: campaignMatchIds }     = r_matchIds

  const avgScore =
    scoreRows?.length
      ? Math.round(
          scoreRows.reduce((sum, r) => sum + (r.talent_score ?? 0), 0) / scoreRows.length,
        )
      : null

  const matchCountByCampaign = new Map<string, number>()
  campaignMatchIds?.forEach(({ campaign_id }) => {
    matchCountByCampaign.set(campaign_id, (matchCountByCampaign.get(campaign_id) ?? 0) + 1)
  })

  const topInfluencers = (topInfluencerData ?? []) as Influencer[]
  const recentCampaigns = (recentCampaignData ?? []) as Campaign[]

  const dateStr = new Date().toLocaleDateString(t.common.dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.dashboard.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dateStr}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/campaigns/new">{t.dashboard.createCampaign}</Link>
        </Button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          iconClass="bg-blue-50 text-blue-600"
          label={t.dashboard.totalInfluencers}
          value={(influencerCount ?? 0).toLocaleString(t.common.numberLocale)}
          subtext={t.dashboard.inDatabase}
        />
        <StatCard
          icon={Megaphone}
          iconClass="bg-emerald-50 text-emerald-600"
          label={t.dashboard.activeCampaigns}
          value={(activeCampaignCount ?? 0).toLocaleString(t.common.numberLocale)}
          subtext={t.dashboard.inProgress}
        />
        <StatCard
          icon={Target}
          iconClass="bg-violet-50 text-violet-600"
          label={t.dashboard.totalMatches}
          value={(matchCount ?? 0).toLocaleString(t.common.numberLocale)}
          subtext={t.dashboard.fromAllCampaigns}
        />
        <StatCard
          icon={Star}
          iconClass="bg-amber-50 text-amber-600"
          label={t.dashboard.avgTalentScore}
          value={avgScore !== null ? avgScore.toString() : '—'}
          subtext={avgScore !== null ? t.dashboard.outOf100 : t.dashboard.noScoreData}
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent campaigns */}
        <section className="lg:col-span-3">
          <div className="rounded-xl border bg-card shadow-sm">
            <SectionHeader title={t.dashboard.recentCampaigns} href="/campaigns" viewAll={t.common.viewAll} />

            {recentCampaigns.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title={t.dashboard.noCampaigns}
                description={t.dashboard.noCampaignsDesc}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                      <th className="px-6 py-3 text-left font-medium">{t.dashboard.colCampaign}</th>
                      <th className="px-3 py-3 text-left font-medium">{t.dashboard.colStatus}</th>
                      <th className="px-3 py-3 text-right font-medium">{t.dashboard.colBudget}</th>
                      <th className="px-3 py-3 text-right font-medium">{t.dashboard.colMatches}</th>
                      <th className="px-6 py-3 text-right font-medium">{t.dashboard.colCreated}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentCampaigns.map((campaign) => (
                      <CampaignRow
                        key={campaign.id}
                        campaign={campaign}
                        matchCount={matchCountByCampaign.get(campaign.id) ?? 0}
                        t={t}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Top influencers */}
        <section className="lg:col-span-2">
          <div className="rounded-xl border bg-card shadow-sm">
            <SectionHeader title={t.dashboard.topInfluencers} href="/influencers" viewAll={t.common.viewAll} />

            {topInfluencers.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t.dashboard.noInfluencers}
                description={t.dashboard.noInfluencersDesc}
              />
            ) : (
              <ul className="divide-y">
                {topInfluencers.map((inf, i) => (
                  <InfluencerRow key={inf.id} influencer={inf} rank={i + 1} t={t} />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

// ─── Shared section header ─────────────────────────────────────────────────────

function SectionHeader({ title, href, viewAll }: { title: string; href: string; viewAll: string }) {
  return (
    <div className="flex items-center justify-between border-b px-6 py-4">
      <h2 className="font-semibold">{title}</h2>
      <Link
        href={href}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {viewAll}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType
  iconClass: string
  label: string
  value: string
  subtext?: string
}

function StatCard({ icon: Icon, iconClass, label, value, subtext }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {subtext && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>
        <div className={cn('flex-shrink-0 rounded-lg p-2.5', iconClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

// ─── Campaign row ──────────────────────────────────────────────────────────────

type T = ReturnType<typeof getTranslation>

function campaignStatusConfig(status: CampaignStatus, t: T) {
  const labels: Record<CampaignStatus, { label: string; className: string }> = {
    draft: { label: t.status.draft, className: 'bg-slate-100 text-slate-600 hover:bg-slate-100' },
    active: { label: t.status.active, className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
    completed: { label: t.status.completed, className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  }
  return labels[status]
}

function CampaignRow({
  campaign,
  matchCount,
  t,
}: {
  campaign: Campaign
  matchCount: number
  t: T
}) {
  const status = campaignStatusConfig(campaign.status, t)
  const date = new Date(campaign.created_at).toLocaleDateString(t.common.dateLocale, {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })

  return (
    <tr className="transition-colors hover:bg-muted/30">
      <td className="px-6 py-3.5">
        <div>
          <p className="font-medium leading-tight">{campaign.name}</p>
          {campaign.target_categories.length > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {campaign.target_categories.slice(0, 2).join(', ')}
              {campaign.target_categories.length > 2 &&
                ` +${campaign.target_categories.length - 2}`}
            </p>
          )}
        </div>
      </td>
      <td className="px-3 py-3.5">
        <Badge className={cn('text-xs font-medium', status.className)}>{status.label}</Badge>
      </td>
      <td className="px-3 py-3.5 text-right text-sm tabular-nums">
        {campaign.budget.toLocaleString(t.common.numberLocale, {
          style: 'currency',
          currency: 'THB',
          maximumFractionDigits: 0,
        })}
      </td>
      <td className="px-3 py-3.5 text-right">
        <span className="text-sm font-medium tabular-nums">
          {matchCount > 0 ? (
            matchCount.toLocaleString(t.common.numberLocale)
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      </td>
      <td className="px-6 py-3.5 text-right text-xs text-muted-foreground">{date}</td>
    </tr>
  )
}

// ─── Influencer row ────────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<Platform, { label: string; className: string }> = {
  instagram: { label: 'IG', className: 'bg-pink-100 text-pink-700' },
  tiktok: { label: 'TT', className: 'bg-slate-100 text-slate-700' },
  youtube: { label: 'YT', className: 'bg-red-100 text-red-700' },
  facebook: { label: 'FB', className: 'bg-blue-100 text-blue-700' },
}

function talentScoreStyle(score: number) {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  if (score >= 60) return 'bg-blue-50 text-blue-700 ring-blue-600/20'
  if (score >= 40) return 'bg-amber-50 text-amber-700 ring-amber-600/20'
  return 'bg-red-50 text-red-700 ring-red-600/20'
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

function EngagementTrend({ rate }: { rate: number }) {
  if (rate >= 0.05) return <TrendingUp className="h-3 w-3 text-emerald-500" />
  if (rate >= 0.03) return <Minus className="h-3 w-3 text-amber-500" />
  return <TrendingDown className="h-3 w-3 text-red-400" />
}

function InfluencerRow({
  influencer: inf,
  rank,
  t,
}: {
  influencer: Influencer
  rank: number
  t: T
}) {
  const platform = PLATFORM_CONFIG[inf.platform]
  const engagePct = (inf.avg_engagement_rate * 100).toFixed(1)
  const fakePct = inf.talent_score_breakdown?.fake_follower_pct

  return (
    <li className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
      <span className="w-4 flex-shrink-0 text-center text-xs font-medium text-muted-foreground">
        {rank}
      </span>

      <InfluencerAvatar username={inf.username} categories={inf.categories} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">@{inf.username}</p>
          <span
            className={cn(
              'flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
              platform.className,
            )}
          >
            {platform.label}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {formatFollowers(inf.follower_count)} {t.dashboard.followersUnit}
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-0.5">
            <EngagementTrend rate={inf.avg_engagement_rate} />
            {engagePct}%
          </span>
          {fakePct !== undefined && fakePct >= 15 && (
            <>
              <span className="text-border">·</span>
              <span className="text-amber-600">{t.dashboard.fakePct(fakePct)}</span>
            </>
          )}
        </div>
      </div>

      {inf.talent_score !== null && (
        <span
          className={cn(
            'flex-shrink-0 rounded-full px-2.5 py-1 text-sm font-bold ring-1 ring-inset',
            talentScoreStyle(inf.talent_score),
          )}
        >
          {inf.talent_score}
        </span>
      )}
    </li>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
