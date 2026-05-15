'use client'

import { useTransition, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createCampaignAction } from '@/app/actions/campaigns'
import type { Translations } from '@/lib/i18n'

type T = Translations['newCampaign']

// ─── Static config ────────────────────────────────────────────────────────────

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'facebook'] as const

const NICHE_KEYS = ['beauty', 'food', 'lifestyle', 'fitness', 'travel', 'fashion', 'health', 'tech'] as const

const NICHE_COLORS: Record<string, string> = {
  beauty:    'border-pink-200 bg-pink-50 text-pink-700 data-[on=true]:bg-pink-100 data-[on=true]:border-pink-400',
  food:      'border-orange-200 bg-orange-50 text-orange-700 data-[on=true]:bg-orange-100 data-[on=true]:border-orange-400',
  lifestyle: 'border-purple-200 bg-purple-50 text-purple-700 data-[on=true]:bg-purple-100 data-[on=true]:border-purple-400',
  fitness:   'border-green-200 bg-green-50 text-green-700 data-[on=true]:bg-green-100 data-[on=true]:border-green-400',
  travel:    'border-sky-200 bg-sky-50 text-sky-700 data-[on=true]:bg-sky-100 data-[on=true]:border-sky-400',
  fashion:   'border-rose-200 bg-rose-50 text-rose-700 data-[on=true]:bg-rose-100 data-[on=true]:border-rose-400',
  health:    'border-teal-200 bg-teal-50 text-teal-700 data-[on=true]:bg-teal-100 data-[on=true]:border-teal-400',
  tech:      'border-blue-200 bg-blue-50 text-blue-700 data-[on=true]:bg-blue-100 data-[on=true]:border-blue-400',
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'border-pink-200 bg-pink-50 text-pink-700 data-[on=true]:bg-pink-100 data-[on=true]:border-pink-400',
  tiktok:    'border-slate-200 bg-slate-50 text-slate-700 data-[on=true]:bg-slate-100 data-[on=true]:border-slate-500',
  youtube:   'border-red-200 bg-red-50 text-red-700 data-[on=true]:bg-red-100 data-[on=true]:border-red-400',
  facebook:  'border-blue-200 bg-blue-50 text-blue-700 data-[on=true]:bg-blue-100 data-[on=true]:border-blue-400',
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
}

// ─── Chip toggle component ─────────────────────────────────────────────────────

function Chip({
  label,
  selected,
  colorClass,
  onClick,
}: {
  label: string
  selected: boolean
  colorClass: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      data-on={selected}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
        colorClass,
        selected && 'shadow-sm',
      )}
    >
      {selected && <span className="mr-1">✓</span>}
      {label}
    </button>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface NewCampaignFormProps {
  t: T
  nicheLabels: Record<string, string>
}

export function NewCampaignForm({ t, nicheLabels }: NewCampaignFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])
  const [status, setStatus] = useState<'draft' | 'active'>('draft')

  function toggleCategory(value: string) {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    )
  }

  function togglePlatform(value: string) {
    setPlatforms((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value],
    )
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (categories.length === 0) {
      setError(t.errorCategoryRequired)
      return
    }
    if (platforms.length === 0) {
      setError(t.errorPlatformRequired)
      return
    }

    const baseData = new FormData(e.currentTarget)
    categories.forEach((c) => baseData.append('categories', c))
    platforms.forEach((p) => baseData.append('platforms', p))
    baseData.set('status', status)

    startTransition(async () => {
      const result = await createCampaignAction(baseData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Section 1: Basics ── */}
      <FormSection title={t.sectionBasic}>
        <Field label={t.labelName + ' *'}>
          <Input
            name="name"
            placeholder={t.placeholderName}
            required
            disabled={pending}
            className="h-11"
          />
        </Field>

        <Field label={t.labelBrand}>
          <Input
            name="brand"
            placeholder={t.placeholderBrand}
            disabled={pending}
            className="h-11"
          />
        </Field>

        <Field label={t.labelBrief}>
          <Textarea
            name="description"
            placeholder={t.placeholderBrief}
            disabled={pending}
            rows={4}
          />
        </Field>
      </FormSection>

      {/* ── Section 2: Budget & Status ── */}
      <FormSection title="งบประมาณ & สถานะ">
        <Field label={t.labelBudget + ' *'}>
          <div className="relative">
            <Input
              name="budget"
              type="number"
              min="1"
              step="1"
              placeholder={t.placeholderBudget}
              required
              disabled={pending}
              className="h-11 pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ฿
            </span>
          </div>
        </Field>

        <Field label={t.labelStatus}>
          <div className="grid grid-cols-2 gap-3">
            {(['draft', 'active'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-all',
                  status === s
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/30',
                )}
              >
                <p className="text-sm font-medium">
                  {s === 'draft' ? t.statusDraft : t.statusActive}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s === 'draft' ? t.statusDraftDesc : t.statusActiveDesc}
                </p>
              </button>
            ))}
          </div>
        </Field>
      </FormSection>

      {/* ── Section 3: Targeting ── */}
      <FormSection title={t.sectionTarget}>
        <Field label={t.labelCategories + ' *'}>
          <div className="flex flex-wrap gap-2">
            {NICHE_KEYS.map((key) => (
              <Chip
                key={key}
                label={nicheLabels[key] ?? key}
                selected={categories.includes(key)}
                colorClass={NICHE_COLORS[key]}
                onClick={() => toggleCategory(key)}
              />
            ))}
          </div>
        </Field>

        <Field label={t.labelPlatforms + ' *'}>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <Chip
                key={p}
                label={PLATFORM_LABELS[p]}
                selected={platforms.includes(p)}
                colorClass={PLATFORM_COLORS[p]}
                onClick={() => togglePlatform(p)}
              />
            ))}
          </div>
        </Field>
      </FormSection>

      {/* ── Section 4: Schedule ── */}
      <FormSection title={t.sectionSchedule}>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t.labelStartDate}>
            <Input name="start_date" type="date" disabled={pending} className="h-11" />
          </Field>
          <Field label={t.labelEndDate}>
            <Input name="end_date" type="date" disabled={pending} className="h-11" />
          </Field>
        </div>
      </FormSection>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.push('/campaigns')}
        >
          {t.cancel}
        </Button>
        <Button type="submit" disabled={pending} className="min-w-[140px]">
          {pending ? t.submitting : t.submit}
        </Button>
      </div>
    </form>
  )
}
