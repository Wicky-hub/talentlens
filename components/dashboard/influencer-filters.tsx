'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/i18n/locale-provider'

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'facebook'] as const
const NICHES = ['beauty', 'food', 'lifestyle', 'fitness', 'travel', 'fashion', 'health', 'tech'] as const

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
}

const NICHE_IDLE: Record<string, string> = {
  beauty:    'bg-pink-50 text-pink-700 border-pink-200',
  food:      'bg-orange-50 text-orange-700 border-orange-200',
  lifestyle: 'bg-purple-50 text-purple-700 border-purple-200',
  fitness:   'bg-green-50 text-green-700 border-green-200',
  travel:    'bg-sky-50 text-sky-700 border-sky-200',
  fashion:   'bg-rose-50 text-rose-700 border-rose-200',
  health:    'bg-teal-50 text-teal-700 border-teal-200',
  tech:      'bg-blue-50 text-blue-700 border-blue-200',
}

const fieldClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ' +
  'focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export function InfluencerFilters() {
  const { t } = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showPanel, setShowPanel] = useState(false)

  // Text search — debounced
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  // Number range inputs — applied on blur/Enter
  const [localMinScore, setLocalMinScore] = useState(searchParams.get('minScore') ?? '')
  const [localMaxScore, setLocalMaxScore] = useState(searchParams.get('maxScore') ?? '')
  const [localMinBudget, setLocalMinBudget] = useState(searchParams.get('minBudget') ?? '')
  const [localMaxBudget, setLocalMaxBudget] = useState(searchParams.get('maxBudget') ?? '')

  const activePlatforms = searchParams.getAll('platform')
  const activeNiches = searchParams.getAll('niche')
  const followers = searchParams.get('followers') ?? ''
  const sort = searchParams.get('sort') ?? 'talent_score'

  const activeFilterCount =
    activePlatforms.length +
    activeNiches.length +
    (followers ? 1 : 0) +
    (searchParams.get('minScore') ? 1 : 0) +
    (searchParams.get('maxScore') ? 1 : 0) +
    (searchParams.get('minBudget') ? 1 : 0) +
    (searchParams.get('maxBudget') ? 1 : 0)

  // Sync local inputs when URL changes (browser back/forward)
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
    setLocalMinScore(searchParams.get('minScore') ?? '')
    setLocalMaxScore(searchParams.get('maxScore') ?? '')
    setLocalMinBudget(searchParams.get('minBudget') ?? '')
    setLocalMaxBudget(searchParams.get('maxBudget') ?? '')
  }, [searchParams])

  // Debounce search query 300ms — read window.location.search inside timer to avoid stale closure
  useEffect(() => {
    if (query === (searchParams.get('q') ?? '')) return
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (query) params.set('q', query)
      else params.delete('q')
      startTransition(() => router.push(`/influencers?${params.toString()}`))
    }, 300)
    return () => clearTimeout(timer)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    startTransition(() => router.push(`/influencers?${params.toString()}`))
  }

  function toggleMultiParam(key: string, value: string) {
    const params = new URLSearchParams(window.location.search)
    const current = params.getAll(key)
    params.delete(key)
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    next.forEach((v) => params.append(key, v))
    startTransition(() => router.push(`/influencers?${params.toString()}`))
  }

  function clearAll() {
    setQuery('')
    setLocalMinScore('')
    setLocalMaxScore('')
    setLocalMinBudget('')
    setLocalMaxBudget('')
    startTransition(() => router.push('/influencers'))
  }

  const isActive = showPanel || activeFilterCount > 0

  const SORT_OPTIONS = [
    { value: 'talent_score',       label: t.filters.sortByScore },
    { value: 'follower_count',     label: t.filters.sortByFollowers },
    { value: 'avg_engagement_rate', label: t.filters.sortByEngagement },
    { value: 'price_per_post',     label: t.filters.sortByPrice },
  ]

  const FOLLOWERS_OPTIONS = [
    { value: '',       label: t.filters.followersAny },
    { value: 'lt10k',   label: t.filters.followersLt10k },
    { value: '10k50k',  label: t.filters.followers10k50k },
    { value: '50k100k', label: t.filters.followers50k100k },
    { value: 'gt100k',  label: t.filters.followersGt100k },
  ]

  return (
    <div className="space-y-3">
      {/* Row: search + filter toggle + sort */}
      <div className="flex gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.filters.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        <Button
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          className="h-10 gap-1.5 px-3"
          onClick={() => setShowPanel((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">{t.filters.filterTitle}</span>
          {activeFilterCount > 0 && (
            <span className="ml-0.5 rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold leading-none">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Sort — desktop only; mobile sort lives inside the panel */}
        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="hidden h-10 min-w-[168px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:block"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Collapsible filter panel */}
      {showPanel && (
        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">

          {/* Platforms */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t.filters.platform}
            </p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = activePlatforms.includes(p)
                return (
                  <button
                    key={p}
                    onClick={() => toggleMultiParam('platform', p)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:bg-muted',
                    )}
                  >
                    {PLATFORM_LABELS[p]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Niches */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t.filters.niche}
            </p>
            <div className="flex flex-wrap gap-2">
              {NICHES.map((n) => {
                const active = activeNiches.includes(n)
                return (
                  <button
                    key={n}
                    onClick={() => toggleMultiParam('niche', n)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : cn('border', NICHE_IDLE[n] ?? 'border-border bg-muted text-muted-foreground'),
                    )}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Followers · TalentScore · Budget */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.filters.followersRange}
              </p>
              <select
                value={followers}
                onChange={(e) => updateParam('followers', e.target.value)}
                className={fieldClass}
              >
                {FOLLOWERS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.filters.talentScore}
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={0} max={100} placeholder="0"
                  value={localMinScore}
                  onChange={(e) => setLocalMinScore(e.target.value)}
                  onBlur={() => updateParam('minScore', localMinScore)}
                  onKeyDown={(e) => e.key === 'Enter' && updateParam('minScore', localMinScore)}
                  className={fieldClass}
                />
                <span className="flex-shrink-0 text-xs text-muted-foreground">–</span>
                <input
                  type="number" min={0} max={100} placeholder="100"
                  value={localMaxScore}
                  onChange={(e) => setLocalMaxScore(e.target.value)}
                  onBlur={() => updateParam('maxScore', localMaxScore)}
                  onKeyDown={(e) => e.key === 'Enter' && updateParam('maxScore', localMaxScore)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.filters.budget}
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={0} placeholder="0"
                  value={localMinBudget}
                  onChange={(e) => setLocalMinBudget(e.target.value)}
                  onBlur={() => updateParam('minBudget', localMinBudget)}
                  onKeyDown={(e) => e.key === 'Enter' && updateParam('minBudget', localMinBudget)}
                  className={fieldClass}
                />
                <span className="flex-shrink-0 text-xs text-muted-foreground">–</span>
                <input
                  type="number" min={0} placeholder="∞"
                  value={localMaxBudget}
                  onChange={(e) => setLocalMaxBudget(e.target.value)}
                  onBlur={() => updateParam('maxBudget', localMaxBudget)}
                  onKeyDown={(e) => e.key === 'Enter' && updateParam('maxBudget', localMaxBudget)}
                  className={fieldClass}
                />
              </div>
            </div>
          </div>

          {/* Sort (mobile) + Clear all */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:hidden"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {(activeFilterCount > 0 || query) && (
              <button
                onClick={clearAll}
                className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
                {t.filters.clearAll}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
