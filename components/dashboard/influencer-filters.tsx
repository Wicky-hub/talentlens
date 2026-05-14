'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { value: '', label: 'ทุกแพลตฟอร์ม' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
]

const MIN_SCORES = [
  { value: '', label: 'คะแนนทั้งหมด' },
  { value: '60', label: 'TalentScore ≥ 60' },
  { value: '70', label: 'TalentScore ≥ 70' },
  { value: '80', label: 'TalentScore ≥ 80' },
]

const SORT_OPTIONS = [
  { value: 'talent_score', label: 'TalentScore สูงสุด' },
  { value: 'follower_count', label: 'ผู้ติดตามมากสุด' },
  { value: 'avg_engagement_rate', label: 'Engagement สูงสุด' },
]

const selectClass =
  'h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

export function InfluencerFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  // Sync query state if browser back/forward changes URL
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  // Debounce keyword: only navigate after 400ms of no typing
  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (query === current) return
    const timer = setTimeout(() => updateParam('q', query), 400)
    return () => clearTimeout(timer)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    startTransition(() => router.push(`/influencers?${params.toString()}`))
  }

  const hasFilters =
    !!searchParams.get('q') ||
    !!searchParams.get('platform') ||
    !!searchParams.get('minScore')

  function clearAll() {
    setQuery('')
    startTransition(() => router.push('/influencers'))
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาชื่อหรือ @username..."
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

      {/* Platform */}
      <select
        value={searchParams.get('platform') ?? ''}
        onChange={(e) => updateParam('platform', e.target.value)}
        className={selectClass}
      >
        {PLATFORMS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Min TalentScore */}
      <select
        value={searchParams.get('minScore') ?? ''}
        onChange={(e) => updateParam('minScore', e.target.value)}
        className={selectClass}
      >
        {MIN_SCORES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={searchParams.get('sort') ?? 'talent_score'}
        onChange={(e) => updateParam('sort', e.target.value)}
        className={selectClass}
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className={cn(
            'flex h-10 items-center gap-1.5 rounded-md border border-input px-3 text-sm',
            'text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <X className="h-3.5 w-3.5" />
          ล้าง
        </button>
      )}
    </div>
  )
}
