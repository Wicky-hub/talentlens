import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Wallet,
  Target,
  Pencil,
  ArrowRight,
  Tag,
  Monitor,
} from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import type { Campaign, CampaignStatus } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getLocale } from '@/lib/locale'
import { getTranslation } from '@/lib/i18n'
import { DeleteCampaignButton } from '@/components/campaigns/delete-campaign-button'

export const dynamic = 'force-dynamic'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CampaignStatus, { label_th: string; label_en: string; className: string; dot: string }> = {
  draft:     { label_th: 'ร่าง',      label_en: 'Draft',     className: 'bg-slate-100 text-slate-600',  dot: 'bg-slate-400' },
  active:    { label_th: 'ใช้งาน',    label_en: 'Active',    className: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  completed: { label_th: 'เสร็จสิ้น', label_en: 'Completed', className: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
}

const PLATFORM_CONFIG: Record<string, { label: string; className: string }> = {
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

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [locale, supabase] = await Promise.all([getLocale(), createServerClient()])
  const t = getTranslation(locale)

  const [
    { data: { user } },
    { data: campaignRow },
    { count: matchCount },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('campaigns').select('*').eq('id', params.id).single(),
    supabase
      .from('campaign_matches')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', params.id),
  ])

  if (!campaignRow) notFound()

  const campaign = campaignRow as Campaign
  const isOwner = user?.id === campaign.sme_id
  const status = STATUS_CONFIG[campaign.status]
  const statusLabel = locale === 'en' ? status.label_en : status.label_th

  const deleteLabels = {
    deleteButton:        t.campaigns.deleteButton,
    deleteConfirmTitle:  t.campaigns.deleteConfirmTitle,
    deleteConfirmDesc:   t.campaigns.deleteConfirmDesc,
    deleteConfirmAction: t.campaigns.deleteConfirmAction,
    deleteCancelAction:  t.campaigns.deleteCancelAction,
    deleting:            t.campaigns.deleting,
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ── Back link ── */}
      <Link
        href="/campaigns"
        className="inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        {t.campaigns.backToList}
      </Link>

      {/* ── Header card ── */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn('gap-1.5 text-xs font-medium', status.className)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                {statusLabel}
              </Badge>
              {campaign.brand && (
                <span className="text-sm text-muted-foreground">{campaign.brand}</span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{campaign.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.campaigns.detailCreated}: {formatDate(campaign.created_at, t.common.dateLocale)}
            </p>
          </div>

          {/* Owner-only actions */}
          {isOwner && (
            <div className="flex flex-shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/campaigns/${campaign.id}/edit`} className="gap-1.5">
                  <Pencil className="h-4 w-4" />
                  {t.campaigns.editButton}
                </Link>
              </Button>
              <DeleteCampaignButton
                campaignId={campaign.id}
                campaignName={campaign.name}
                labels={deleteLabels}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Metric grid ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          icon={Wallet}
          label={t.campaigns.budget}
          value={campaign.budget.toLocaleString(t.common.numberLocale, {
            style: 'currency',
            currency: 'THB',
            maximumFractionDigits: 0,
          })}
        />
        <MetricCard
          icon={Target}
          label={t.campaigns.detailMatchCount}
          value={(matchCount ?? 0).toLocaleString(t.common.numberLocale)}
        />
        <MetricCard
          icon={Calendar}
          label={t.campaigns.detailSchedule}
          value={
            campaign.start_date
              ? `${formatDate(campaign.start_date, t.common.dateLocale).slice(0, 6)} →`
              : t.campaigns.noDate
          }
          sub={
            campaign.end_date
              ? formatDate(campaign.end_date, t.common.dateLocale).slice(0, 6)
              : undefined
          }
        />
        <MetricCard
          icon={Monitor}
          label={t.campaigns.detailPlatforms}
          value={
            campaign.target_platforms?.length
              ? campaign.target_platforms.length.toString()
              : '—'
          }
          sub={campaign.target_platforms?.join(', ')}
        />
      </div>

      {/* ── Platforms ── */}
      {campaign.target_platforms?.length > 0 && (
        <Section label={t.campaigns.detailPlatforms} icon={Monitor}>
          <div className="flex flex-wrap gap-2">
            {campaign.target_platforms.map((p) => {
              const cfg = PLATFORM_CONFIG[p]
              return (
                <Badge key={p} className={cn('text-xs', cfg?.className ?? '')}>
                  {cfg?.label ?? p}
                </Badge>
              )
            })}
          </div>
        </Section>
      )}

      {/* ── Categories ── */}
      {campaign.target_categories.length > 0 && (
        <Section label={t.campaigns.detailCategories} icon={Tag}>
          <div className="flex flex-wrap gap-2">
            {campaign.target_categories.map((cat) => (
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

      {/* ── Schedule detail ── */}
      {(campaign.start_date || campaign.end_date) && (
        <Section label={t.campaigns.detailSchedule} icon={Calendar}>
          <div className="flex items-center gap-3 text-sm">
            <span>{campaign.start_date ? formatDate(campaign.start_date, t.common.dateLocale) : t.campaigns.noDate}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span>{campaign.end_date ? formatDate(campaign.end_date, t.common.dateLocale) : t.campaigns.noDate}</span>
          </div>
        </Section>
      )}

      {/* ── Brief ── */}
      <Section label={t.campaigns.detailBrief} icon={Target}>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {campaign.description || (
            <span className="italic text-muted-foreground">{t.campaigns.noBrief}</span>
          )}
        </p>
      </Section>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-base font-bold leading-tight">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function Section({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {children}
    </div>
  )
}
