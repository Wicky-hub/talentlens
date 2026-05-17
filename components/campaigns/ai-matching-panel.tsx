'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/i18n/locale-provider'
import {
  runAIMatchingAction,
  addInfluencerToCampaignAction,
} from '@/app/actions/matching'
import { InfluencerAvatar } from '@/components/dashboard/influencer-avatar'
import type { AIMatchResult } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(n: number): string {
  if (n >= 80) return 'bg-emerald-100 text-emerald-700 ring-emerald-600/20'
  if (n >= 60) return 'bg-blue-100 text-blue-700 ring-blue-600/20'
  if (n >= 40) return 'bg-amber-100 text-amber-700 ring-amber-600/20'
  return 'bg-red-100 text-red-700 ring-red-600/20'
}

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toString()
}

const PLATFORM_STYLE: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700',
  tiktok:    'bg-slate-100 text-slate-700',
  youtube:   'bg-red-100 text-red-700',
  facebook:  'bg-blue-100 text-blue-700',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AiMatchingPanelProps {
  campaignId: string
  alreadyAddedIds: string[]
}

export function AiMatchingPanel({
  campaignId,
  alreadyAddedIds,
}: AiMatchingPanelProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [results, setResults] = useState<AIMatchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'done'>('idle')
  const [added, setAdded] = useState<Set<string>>(() => new Set(alreadyAddedIds))
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  const tm = t.matching

  function handleFind() {
    setError(null)
    setAddError(null)
    startTransition(async () => {
      const result = await runAIMatchingAction(campaignId)
      if (result.error) {
        setError(result.error)
      } else {
        setResults(result.matches ?? [])
        setPhase('done')
      }
    })
  }

  async function handleAdd(match: AIMatchResult) {
    setAddingId(match.influencer_id)
    setAddError(null)
    const result = await addInfluencerToCampaignAction(campaignId, match.influencer_id, {
      match_score: match.match_score,
      ai_reasoning: match.reasoning,
      estimated_reach: match.estimated_reach,
    })
    setAddingId(null)
    if (result.error) {
      setAddError(result.error)
    } else {
      setAdded((prev) => { const s = new Set(prev); s.add(match.influencer_id); return s })
      router.refresh()
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">{tm.panelTitle}</h2>
        </div>
        {phase === 'done' && !isPending && (
          <Button variant="outline" size="sm" onClick={handleFind} disabled={isPending}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {tm.runAgain}
          </Button>
        )}
      </div>

      <div className="p-5">

        {/* ── Idle ── */}
        {phase === 'idle' && !isPending && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-primary/10 p-5">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">{tm.findButton}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tm.noInfluencersDesc}</p>
            </div>
            <Button onClick={handleFind} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {tm.findButton}
            </Button>
            {error && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </p>
            )}
          </div>
        )}

        {/* ── Loading ── */}
        {isPending && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{tm.analyzing}</p>
          </div>
        )}

        {/* ── Results ── */}
        {phase === 'done' && !isPending && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              {tm.resultsTitle(results.length)}
            </p>

            {addError && (
              <p className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {addError}
              </p>
            )}

            {error && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </p>
            )}

            {results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {tm.noResults}
              </p>
            ) : (
              results.map((match, i) => {
                const inf = match.influencer
                const isAdded = added.has(match.influencer_id)
                const isLoading = addingId === match.influencer_id
                const price = inf?.price_per_post ?? 0

                return (
                  <div
                    key={match.influencer_id}
                    className={cn(
                      'rounded-xl border p-4 transition-colors',
                      isAdded
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'bg-background hover:bg-muted/20',
                    )}
                  >
                    {/* Top row: rank + avatar + name + score + add button */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        {inf && (
                          <InfluencerAvatar
                            username={inf.username}
                            categories={inf.categories}
                            size="md"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold">
                              @{inf?.username ?? match.influencer_id.slice(0, 8)}
                            </span>
                            {inf && (
                              <Badge
                                className={cn(
                                  'text-[10px]',
                                  PLATFORM_STYLE[inf.platform] ?? '',
                                )}
                              >
                                {inf.platform}
                              </Badge>
                            )}
                          </div>
                          {inf && (
                            <p className="text-xs text-muted-foreground">
                              {formatK(inf.follower_count)} followers
                              {' · '}
                              {(inf.avg_engagement_rate * 100).toFixed(1)}% engagement
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Score + Add */}
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-sm font-bold ring-1 ring-inset',
                            scoreColor(match.match_score),
                          )}
                        >
                          {match.match_score}%
                        </span>

                        {isAdded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {tm.added}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5"
                            disabled={isLoading || !!addingId}
                            onClick={() => handleAdd(match)}
                          >
                            {isLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                            {isLoading ? tm.adding : tm.addButton}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2.5">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {tm.reasoning}
                      </p>
                      <p className="text-sm leading-relaxed">{match.reasoning}</p>
                    </div>

                    {/* Stats */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        <span className="font-semibold text-foreground">
                          {formatK(match.estimated_reach)}
                        </span>{' '}
                        {tm.reachUnit} · {tm.estimatedReach}
                      </span>
                      {price > 0 && (
                        <span>
                          <span className="font-semibold text-foreground">
                            ฿{price.toLocaleString('th-TH')}
                          </span>
                          /โพสต์
                        </span>
                      )}
                      {match.roi_estimate && (
                        <span className="italic opacity-80">{match.roi_estimate}</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
