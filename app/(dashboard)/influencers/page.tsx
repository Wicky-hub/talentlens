import { Suspense } from 'react'
import Link from 'next/link'
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import type { Influencer, Platform } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { InfluencerFilters } from '@/components/dashboard/influencer-filters'
import { InfluencerAvatar } from '@/components/dashboard/influencer-avatar'
import { getLocale } from '@/lib/locale'
import { getTranslation } from '@/lib/i18n'

// ─── Types ────────────────────────────────────────────────────────────────────

type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined }
}

type SortColumn = 'talent_score' | 'follower_count' | 'avg_engagement_rate' | 'price_per_post'
type T = ReturnType<typeof getTranslation>

const VALID_PLATFORMS: Platform[] = ['instagram', 'tiktok', 'youtube', 'facebook']
const VALID_NICHES = ['beauty', 'food', 'lifestyle', 'fitness', 'travel', 'fashion', 'health', 'tech']
const VALID_SORTS: SortColumn[] = ['talent_score', 'follower_count', 'avg_engagement_rate', 'price_per_post']
const VALID_FOLLOWERS = ['lt10k', '10k50k', '50k100k', 'gt100k']

// ─── Param helpers ────────────────────────────────────────────────────────────

function sp(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? ''
}

function spArr(v: string | string[] | undefined): string[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function parseNum(s: string): number {
  const n = parseInt(s, 10)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

// ─── Display helpers ──────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<Platform, { label: string; className: string }> = {
  instagram: { label: 'Instagram', className: 'bg-pink-100 text-pink-700' },
  tiktok:    { label: 'TikTok',    className: 'bg-slate-100 text-slate-700' },
  youtube:   { label: 'YouTube',   className: 'bg-red-100 text-red-700' },
  facebook:  { label: 'Facebook',  className: 'bg-blue-100 text-blue-700' },
}

function scoreStyle(score: number): string {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  if (score >= 60) return 'bg-blue-50 text-blue-700 ring-blue-600/20'
  if (score >= 40) return 'bg-amber-50 text-amber-700 ring-amber-600/20'
  return 'bg-red-50 text-red-700 ring-red-600/20'
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toString()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InfluencersPage({ searchParams }: PageProps) {
  const [locale, supabase] = await Promise.all([getLocale(), createServerClient()])
  const t = getTranslation(locale)

  const q         = sp(searchParams.q).trim().slice(0, 100)
  const platforms = spArr(searchParams.platform).filter((p) => VALID_PLATFORMS.includes(p as Platform)) as Platform[]
  const niches    = spArr(searchParams.niche).filter((n) => VALID_NICHES.includes(n))
  const followers = VALID_FOLLOWERS.includes(sp(searchParams.followers)) ? sp(searchParams.followers) : ''
  const minScore  = parseNum(sp(searchParams.minScore))
  const maxScore  = parseNum(sp(searchParams.maxScore))
  const minBudget = parseNum(sp(searchParams.minBudget))
  const maxBudget = parseNum(sp(searchParams.maxBudget))
  const sort: SortColumn = VALID_SORTS.includes(sp(searchParams.sort) as SortColumn)
    ? (sp(searchParams.sort) as SortColumn)
    : 'talent_score'

  let query = supabase.from('influencers').select('*')

  if (q) query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
  if (platforms.length > 0) query = query.in('platform', platforms)
  if (niches.length > 0) query = query.overlaps('categories', niches)

  switch (followers) {
    case 'lt10k':   query = query.lt('follower_count', 10_000); break
    case '10k50k':  query = query.gte('follower_count', 10_000).lte('follower_count', 50_000); break
    case '50k100k': query = query.gte('follower_count', 50_000).lte('follower_count', 100_000); break
    case 'gt100k':  query = query.gte('follower_count', 100_000); break
  }

  if (minScore > 0)           query = query.gte('talent_score', minScore)
  if (maxScore > 0 && maxScore < 100) query = query.lte('talent_score', maxScore)
  if (minBudget > 0)          query = query.gte('price_per_post', minBudget)
  if (maxBudget > 0)          query = query.lte('price_per_post', maxBudget)

  const ascending = sort === 'price_per_post'
  const { data } = await query.order(sort, { ascending }).limit(48)

  const influencers = (data ?? []) as Influencer[]
  const isFiltered = !!(q || platforms.length || niches.length || followers || minScore || maxScore || minBudget || maxBudget)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.influencers.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isFiltered
            ? t.influencers.foundResult(influencers.length)
            : t.influencers.subtitle}
        </p>
      </div>

      {/* Filters — Suspense needed because InfluencerFilters uses useSearchParams */}
      <Suspense fallback={<FiltersSkeleton />}>
        <InfluencerFilters />
      </Suspense>

      {/* Results */}
      {influencers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-20 text-center">
          <div className="rounded-full bg-muted p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium">{t.influencers.notFound}</p>
          <p className="text-sm text-muted-foreground">
            {isFiltered ? t.influencers.tryAdjust : t.influencers.addToStart}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {influencers.map((inf) => (
            <InfluencerCard key={inf.id} influencer={inf} t={t} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Influencer card ──────────────────────────────────────────────────────────

function InfluencerCard({ influencer: inf, t }: { influencer: Influencer; t: T }) {
  const platform  = PLATFORM_CONFIG[inf.platform]
  const fakePct   = inf.talent_score_breakdown?.fake_follower_pct ?? null
  const isVerified = fakePct !== null && fakePct < 10
  const engagePct = (inf.avg_engagement_rate * 100).toFixed(1)
  const price     = inf.price_per_post ?? 0
  const priceLabel = price > 0
    ? `฿${price.toLocaleString('th-TH')}`
    : '—'

  return (
    <Link href={`/influencers/${inf.id}`} className="group block">
      <div className="flex h-full flex-col rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">

        {/* Header */}
        <div className="flex items-start gap-4 p-5">
          <InfluencerAvatar username={inf.username} categories={inf.categories} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate font-semibold">@{inf.username}</p>
                  {isVerified && (
                    <span className="flex-shrink-0 inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {t.influencers.verified}
                    </span>
                  )}
                </div>
                {inf.display_name && inf.display_name !== inf.username && (
                  <p className="truncate text-xs text-muted-foreground">{inf.display_name}</p>
                )}
              </div>
              <Badge className={cn('flex-shrink-0 text-xs', platform.className)}>
                {platform.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-px border-y bg-muted/50">
          <div className="bg-card px-5 py-3">
            <p className="text-xs text-muted-foreground">{t.influencers.followers}</p>
            <p className="mt-0.5 text-base font-bold">{formatFollowers(inf.follower_count)}</p>
          </div>
          <div className="bg-card px-5 py-3">
            <p className="text-xs text-muted-foreground">{t.influencers.engagement}</p>
            <div className="mt-0.5 flex items-center gap-1">
              <EngagementIcon rate={inf.avg_engagement_rate} />
              <p className="text-base font-bold">{engagePct}%</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          {inf.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {inf.categories.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                >
                  {cat}
                </span>
              ))}
              {inf.categories.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{inf.categories.length - 3}
                </span>
              )}
            </div>
          )}

          {fakePct !== null && fakePct >= 15 && (
            <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {t.influencers.fakePctWarning(fakePct)}
            </div>
          )}
        </div>

        {/* Footer: price + TalentScore */}
        <div className="flex items-center justify-between rounded-b-xl border-t bg-muted/20 px-5 py-3">
          <div>
            <p className="text-[10px] text-muted-foreground">{t.influencers.pricePerPost}</p>
            <p className="text-sm font-semibold">{priceLabel}</p>
          </div>
          {inf.talent_score !== null ? (
            <span
              className={cn(
                'rounded-full px-3 py-1 text-sm font-bold ring-1 ring-inset',
                scoreStyle(inf.talent_score),
              )}
            >
              {inf.talent_score}
              <span className="ml-0.5 text-xs font-normal opacity-70">/100</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{t.influencers.noScore}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function EngagementIcon({ rate }: { rate: number }) {
  if (rate >= 0.05) return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
  if (rate >= 0.03) return <Minus className="h-3.5 w-3.5 text-amber-500" />
  return <TrendingDown className="h-3.5 w-3.5 text-red-400" />
}

function FiltersSkeleton() {
  return (
    <div className="flex gap-3">
      {[240, 100, 160].map((w, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-muted" style={{ width: w }} />
      ))}
    </div>
  )
}
