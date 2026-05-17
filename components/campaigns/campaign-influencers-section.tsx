'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/i18n/locale-provider'
import { InfluencerAvatar } from '@/components/dashboard/influencer-avatar'
import { updateCampaignInfluencerStatusAction } from '@/app/actions/matching'
import type { CampaignInfluencer } from '@/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-slate-100 text-slate-600',
  contacted: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-700',
}

const PLATFORM_STYLE: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700',
  tiktok:    'bg-slate-100 text-slate-700',
  youtube:   'bg-red-100 text-red-700',
  facebook:  'bg-blue-100 text-blue-700',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CampaignInfluencersSectionProps {
  campaignId: string
  items: CampaignInfluencer[]
}

export function CampaignInfluencersSection({
  campaignId,
  items,
}: CampaignInfluencersSectionProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const tm = t.matching

  async function handleStatusChange(id: string, status: string) {
    setPendingId(id)
    setSaveError(null)
    const result = await updateCampaignInfluencerStatusAction(id, status, campaignId)
    setPendingId(null)
    if (result.error) {
      setSaveError(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b p-5">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">{tm.sectionTitle}</h2>
        {items.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {items.length}
          </span>
        )}
      </div>

      {saveError && (
        <p className="mx-5 mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {saveError}
        </p>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <Users className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium">{tm.noInfluencers}</p>
          <p className="text-xs text-muted-foreground">{tm.noInfluencersDesc}</p>
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((item) => {
            const inf = item.influencer
            const isPending = pendingId === item.id
            const price = inf?.price_per_post ?? 0

            return (
              <li key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                {/* Avatar + info */}
                {inf ? (
                  <>
                    <InfluencerAvatar
                      username={inf.username}
                      categories={inf.categories}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold">@{inf.username}</span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-medium',
                            PLATFORM_STYLE[inf.platform] ?? 'bg-muted text-muted-foreground',
                          )}
                        >
                          {inf.platform}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.match_score}% match
                        {price > 0 && ` · ฿${price.toLocaleString('th-TH')}/โพสต์`}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{item.influencer_id}</p>
                  </div>
                )}

                {/* Status selector */}
                <select
                  value={item.status}
                  disabled={isPending}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  className={cn(
                    'cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-medium',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                    'disabled:cursor-wait disabled:opacity-60',
                    STATUS_STYLE[item.status] ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  <option value="pending">{tm.statusPending}</option>
                  <option value="contacted">{tm.statusContacted}</option>
                  <option value="confirmed">{tm.statusConfirmed}</option>
                  <option value="rejected">{tm.statusRejected}</option>
                </select>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
