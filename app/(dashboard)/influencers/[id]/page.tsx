import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import type { Influencer, Platform, TalentScoreBreakdown } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { InfluencerAvatar } from '@/components/dashboard/influencer-avatar'
import { getLocale } from '@/lib/locale'
import { getTranslation } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<Platform, { label: string; className: string }> = {
  instagram: { label: 'Instagram', className: 'bg-pink-100 text-pink-700' },
  tiktok:    { label: 'TikTok',    className: 'bg-slate-100 text-slate-700' },
  youtube:   { label: 'YouTube',   className: 'bg-red-100 text-red-700' },
  facebook:  { label: 'Facebook',  className: 'bg-blue-100 text-blue-700' },
}

const NICHE_COLORS: Record<string, string> = {
  beauty:    'bg-pink-100 text-pink-700',
  food:      'bg-orange-100 text-orange-700',
  lifestyle: 'bg-purple-100 text-purple-700',
  fitness:   'bg-green-100 text-green-700',
  travel:    'bg-sky-100 text-sky-700',
  fashion:   'bg-rose-100 text-rose-700',
  health:    'bg-teal-100 text-teal-700',
  tech:      'bg-blue-100 text-blue-700',
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toString()
}

function scoreStyle(score: number): string {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  if (score >= 60) return 'bg-blue-50 text-blue-700 ring-blue-600/20'
  if (score >= 40) return 'bg-amber-50 text-amber-700 ring-amber-600/20'
  return 'bg-red-50 text-red-700 ring-red-600/20'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InfluencerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [locale, supabase] = await Promise.all([getLocale(), createServerClient()])
  const t = getTranslation(locale)

  const { data } = await supabase.from('influencers').select('*').eq('id', params.id).single()
  if (!data) notFound()

  const inf = data as Influencer
  const platform = PLATFORM_CONFIG[inf.platform]
  const fakePct = inf.talent_score_breakdown?.fake_follower_pct ?? null
  const isVerified = fakePct !== null && fakePct < 10
  const price = inf.price_per_post ?? 0

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/influencers"
        className="inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        {t.influencers.backToList}
      </Link>

      {/* Profile header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-5">
          <InfluencerAvatar username={inf.username} categories={inf.categories} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn('text-xs', platform?.className ?? '')}>
                {platform?.label ?? inf.platform}
              </Badge>
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {t.influencers.verified}
                </span>
              )}
              {fakePct !== null && fakePct >= 15 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  {t.influencers.fakePctWarning(fakePct)}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">@{inf.username}</h1>
            {inf.display_name && inf.display_name !== inf.username && (
              <p className="text-sm text-muted-foreground">{inf.display_name}</p>
            )}
            {inf.location && (
              <p className="mt-0.5 text-xs text-muted-foreground">{inf.location}</p>
            )}
          </div>
          {inf.profile_url && (
            <a
              href={inf.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t.influencers.viewProfile}
            </a>
          )}
        </div>

        {inf.bio ? (
          <p className="mt-4 text-sm leading-relaxed text-foreground/80">{inf.bio}</p>
        ) : (
          <p className="mt-4 text-sm italic text-muted-foreground">{t.influencers.noBio}</p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={t.influencers.followers} value={formatFollowers(inf.follower_count)} />
        <StatCard label={t.influencers.detailFollowing} value={formatFollowers(inf.following_count)} />
        <StatCard label={t.influencers.detailPosts} value={inf.post_count.toLocaleString(t.common.numberLocale)} />
        <StatCard
          label={t.influencers.engagement}
          value={`${(inf.avg_engagement_rate * 100).toFixed(1)}%`}
          icon={<EngagementIcon rate={inf.avg_engagement_rate} />}
        />
      </div>

      {/* Price + TalentScore */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.influencers.pricePerPost}
          </p>
          <p className="mt-2 text-3xl font-bold">
            {price > 0 ? `฿${price.toLocaleString(t.common.numberLocale)}` : '—'}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            TalentScore
          </p>
          {inf.talent_score !== null ? (
            <div className="mt-2 flex items-end gap-1">
              <span
                className={cn(
                  'rounded-full px-4 py-1.5 text-3xl font-bold ring-1 ring-inset',
                  scoreStyle(inf.talent_score),
                )}
              >
                {inf.talent_score}
              </span>
              <span className="mb-1.5 text-sm text-muted-foreground">/100</span>
            </div>
          ) : (
            <p className="mt-2 text-sm italic text-muted-foreground">{t.influencers.noScore}</p>
          )}
        </div>
      </div>

      {/* Categories */}
      {inf.categories.length > 0 && (
        <Section label={t.influencers.detailCategories}>
          <div className="flex flex-wrap gap-2">
            {inf.categories.map((cat) => (
              <span
                key={cat}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  NICHE_COLORS[cat] ?? 'bg-muted text-muted-foreground',
                )}
              >
                {cat}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Score breakdown */}
      {inf.talent_score_breakdown && (
        <Section label={t.influencers.scoreBreakdown}>
          <ScoreBreakdown breakdown={inf.talent_score_breakdown} t={t} />
        </Section>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type T = ReturnType<typeof getTranslation>

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-1">
        {icon}
        <p className="text-base font-bold leading-tight">{value}</p>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}

function ScoreBreakdown({ breakdown, t }: { breakdown: TalentScoreBreakdown; t: T }) {
  const bars = [
    { label: t.influencers.scoreEngagement,    value: breakdown.engagement,      max: 30 },
    { label: t.influencers.scoreAuthenticity,  value: breakdown.authenticity,    max: 25 },
    { label: t.influencers.scoreContentQuality, value: breakdown.content_quality, max: 25 },
    { label: t.influencers.scoreGrowth,        value: breakdown.growth,          max: 20 },
  ]

  return (
    <div className="space-y-3">
      {bars.map((bar) => (
        <div key={bar.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{bar.label}</span>
            <span className="font-medium">
              {bar.value}
              <span className="text-xs text-muted-foreground">/{bar.max}</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(bar.value / bar.max) * 100}%` }}
            />
          </div>
        </div>
      ))}

      {breakdown.rationale && (
        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t.influencers.scoreRationale}
          </p>
          <p className="text-sm leading-relaxed">{breakdown.rationale}</p>
        </div>
      )}
    </div>
  )
}

function EngagementIcon({ rate }: { rate: number }) {
  if (rate >= 0.05) return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
  if (rate >= 0.03) return <Minus className="h-3.5 w-3.5 text-amber-500" />
  return <TrendingDown className="h-3.5 w-3.5 text-red-400" />
}
