import Link from 'next/link'
import { Megaphone, Users, Target, Calendar, Wallet, ChevronRight, Plus } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import type { Campaign, CampaignStatus } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getLocale } from '@/lib/locale'
import { getTranslation } from '@/lib/i18n'

type T = ReturnType<typeof getTranslation>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusConfig(status: CampaignStatus, t: T) {
  const map: Record<CampaignStatus, { label: string; className: string; dot: string }> = {
    draft: { label: t.status.draft, className: 'bg-slate-100 text-slate-600 hover:bg-slate-100', dot: 'bg-slate-400' },
    active: { label: t.status.active, className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100', dot: 'bg-emerald-500' },
    completed: { label: t.status.completed, className: 'bg-blue-100 text-blue-700 hover:bg-blue-100', dot: 'bg-blue-500' },
  }
  return map[status]
}

function formatFollowerRange(min: number, max: number, unit: string): string {
  const fmt = (n: number) => (n >= 1_000 ? `${Math.round(n / 1_000)}K` : n.toString())
  const range = `${fmt(min)} – ${fmt(max)}`
  return unit ? `${range} ${unit}` : range
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CampaignsPage() {
  const [locale, supabase] = await Promise.all([getLocale(), createServerClient()])
  const t = getTranslation(locale)

  const [
    { data: campaignData },
    { count: activeCount },
    { count: completedCount },
    { data: matchIds },
  ] = await Promise.all([
    supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
    supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase.from('campaign_matches').select('campaign_id, status'),
  ])

  const campaigns = (campaignData ?? []) as Campaign[]

  const matchMap = new Map<string, number>()
  matchIds?.forEach(({ campaign_id }) => {
    matchMap.set(campaign_id, (matchMap.get(campaign_id) ?? 0) + 1)
  })

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.campaigns.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.campaigns.subtitle}</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/campaigns/new">
            <Plus className="mr-1.5 h-4 w-4" />
            {t.campaigns.create}
          </Link>
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <MiniStat label={t.campaigns.statTotal} value={campaigns.length} icon={Megaphone} />
        <MiniStat label={t.campaigns.statActive} value={activeCount ?? 0} icon={Target} accent="emerald" />
        <MiniStat label={t.campaigns.statCompleted} value={completedCount ?? 0} icon={Users} accent="blue" />
      </div>

      {/* Count badge */}
      {campaigns.length > 0 && (
        <div className="flex justify-end">
          <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
            {t.campaigns.countBadge(campaigns.length)}
          </span>
        </div>
      )}

      {/* ── Campaign grid ── */}
      {campaigns.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              matchCount={matchMap.get(campaign.id) ?? 0}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mini stat ────────────────────────────────────────────────────────────────

type Accent = 'emerald' | 'blue' | 'default'

function MiniStat({
  label,
  value,
  icon: Icon,
  accent = 'default',
}: {
  label: string
  value: number
  icon: React.ElementType
  accent?: Accent
}) {
  const iconClass =
    accent === 'emerald'
      ? 'text-emerald-600'
      : accent === 'blue'
        ? 'text-blue-600'
        : 'text-muted-foreground'

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon className={cn('h-5 w-5', iconClass)} />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Campaign card ────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  matchCount,
  t,
}: {
  campaign: Campaign
  matchCount: number
  t: T
}) {
  const status = statusConfig(campaign.status, t)
  const createdDate = new Date(campaign.created_at).toLocaleDateString(t.common.dateLocale, {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })

  return (
    <div className="group flex flex-col rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Top: status + date */}
      <div className="flex items-center justify-between px-5 pt-5">
        <Badge className={cn('gap-1.5 text-xs font-medium', status.className)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
          {status.label}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {createdDate}
        </span>
      </div>

      {/* Campaign name + description */}
      <div className="px-5 py-4">
        <h3 className="line-clamp-1 font-semibold">{campaign.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{campaign.description}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-px border-y bg-muted/50">
        <div className="bg-card px-5 py-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            {t.campaigns.budget}
          </div>
          <p className="mt-0.5 font-semibold">
            {campaign.budget.toLocaleString(t.common.numberLocale, {
              style: 'currency',
              currency: 'THB',
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="bg-card px-5 py-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            {t.campaigns.matchesFound}
          </div>
          <p className="mt-0.5 font-semibold">
            {matchCount > 0 ? (
              `${matchCount.toLocaleString(t.common.numberLocale)}`
            ) : (
              <span className="text-muted-foreground">{t.campaigns.noMatches}</span>
            )}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        {campaign.target_categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {campaign.target_categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
              >
                {cat}
              </span>
            ))}
            {campaign.target_categories.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{campaign.target_categories.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {formatFollowerRange(
              campaign.min_followers,
              campaign.max_followers,
              t.common.personsUnit,
            )}
          </span>
          <span>TalentScore ≥ {campaign.min_talent_score}</span>
          {campaign.target_location && <span>📍 {campaign.target_location}</span>}
        </div>
      </div>

      {/* Footer action */}
      <div className="border-t px-5 py-3">
        <button className="flex w-full items-center justify-between text-sm font-medium text-primary transition-colors hover:text-primary/80">
          {t.campaigns.viewMatches}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ t }: { t: T }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card py-24 text-center">
      <div className="rounded-full bg-muted p-5">
        <Megaphone className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{t.campaigns.noCampaigns}</p>
        <p className="text-sm text-muted-foreground">{t.campaigns.noCampaignsDesc}</p>
      </div>
      <Button size="sm" asChild>
        <Link href="/campaigns/new">{t.campaigns.createFirst}</Link>
      </Button>
    </div>
  )
}
