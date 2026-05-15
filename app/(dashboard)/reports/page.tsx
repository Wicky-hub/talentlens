import { FileText, Calendar, ExternalLink } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import type { Report, Campaign, Influencer, Platform } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { getLocale } from '@/lib/locale'
import { getTranslation } from '@/lib/i18n'
import { InfluencerAvatar } from '@/components/dashboard/influencer-avatar'

// ─── Types ────────────────────────────────────────────────────────────────────

type T = ReturnType<typeof getTranslation>

const PLATFORM_CONFIG: Record<Platform, { label: string; className: string }> = {
  instagram: { label: 'Instagram', className: 'bg-pink-100 text-pink-700' },
  tiktok: { label: 'TikTok', className: 'bg-slate-100 text-slate-700' },
  youtube: { label: 'YouTube', className: 'bg-red-100 text-red-700' },
  facebook: { label: 'Facebook', className: 'bg-blue-100 text-blue-700' },
}

function textPreview(md: string, max = 220): string {
  const plain = md
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
  return plain.length > max ? plain.slice(0, max) + '…' : plain
}

type ReportWithMeta = Report & {
  campaign: Pick<Campaign, 'id' | 'name'> | null
  influencer: Pick<Influencer, 'id' | 'username' | 'display_name' | 'platform' | 'categories'> | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportsPage() {
  const [locale, supabase] = await Promise.all([getLocale(), createServerClient()])
  const t = getTranslation(locale)

  const { data: reportRows } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const reports = (reportRows ?? []) as Report[]

  const campaignIds = Array.from(new Set(reports.map((r) => r.campaign_id)))
  const influencerIds = Array.from(new Set(reports.map((r) => r.influencer_id)))

  const [campaignData, influencerData] = await Promise.all([
    campaignIds.length
      ? supabase
          .from('campaigns')
          .select('id, name')
          .in('id', campaignIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    influencerIds.length
      ? supabase
          .from('influencers')
          .select('id, username, display_name, platform, categories')
          .in('id', influencerIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
  ])

  const campaignMap = new Map(
    (campaignData as Pick<Campaign, 'id' | 'name'>[]).map((c) => [c.id, c]),
  )
  const influencerMap = new Map(
    (influencerData as Pick<Influencer, 'id' | 'username' | 'display_name' | 'platform' | 'categories'>[]).map(
      (i) => [i.id, i],
    ),
  )

  const enriched: ReportWithMeta[] = reports.map((r) => ({
    ...r,
    campaign: campaignMap.get(r.campaign_id) ?? null,
    influencer: influencerMap.get(r.influencer_id) ?? null,
  }))

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.reports.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.reports.subtitle}</p>
        </div>
        {reports.length > 0 && (
          <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
            {t.reports.countBadge(reports.length)}
          </span>
        )}
      </div>

      {/* ── Content ── */}
      {enriched.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <div className="space-y-4">
          {enriched.map((report) => (
            <ReportCard key={report.id} report={report} t={t} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Report card ──────────────────────────────────────────────────────────────

function ReportCard({ report, t }: { report: ReportWithMeta; t: T }) {
  const { campaign, influencer } = report
  const platform = influencer ? PLATFORM_CONFIG[influencer.platform] : null
  const preview = textPreview(report.content)
  const date = new Date(report.created_at).toLocaleDateString(t.common.dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const time = new Date(report.created_at).toLocaleTimeString(t.common.dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Card header */}
      <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          {/* Campaign */}
          {campaign ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.reports.campaign}</p>
                <p className="font-medium leading-tight">{campaign.name}</p>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t.reports.noCampaign}</span>
          )}

          <div className="hidden h-8 w-px bg-border sm:block" />

          {/* Influencer */}
          {influencer ? (
            <div className="flex items-center gap-2">
              <InfluencerAvatar username={influencer.username} categories={influencer.categories} size="sm" />
              <div>
                <p className="text-xs text-muted-foreground">{t.reports.influencer}</p>
                <div className="flex items-center gap-1.5">
                  <p className="font-medium leading-tight">@{influencer.username}</p>
                  {platform && (
                    <Badge className={cn('text-[10px] px-1.5 py-0', platform.className)}>
                      {platform.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t.reports.noInfluencer}</span>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {date} · {time}
          </span>
        </div>
      </div>

      {/* Content preview */}
      <div className="px-5 py-4">
        <p className="text-sm leading-relaxed text-foreground/80">{preview}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3 rounded-b-xl">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">{t.reports.generatedBy}</span>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80">
          {t.reports.readFull}
          <ExternalLink className="h-3 w-3" />
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
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{t.reports.noReports}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{t.reports.noReportsDesc}</p>
      </div>
    </div>
  )
}
