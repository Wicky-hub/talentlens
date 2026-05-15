import { cn } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg'

interface InfluencerAvatarProps {
  username: string
  categories?: string[]
  size?: AvatarSize
  className?: string
}

const NICHE_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  beauty:    { bg: 'bg-pink-100',   text: 'text-pink-600',   ring: 'ring-pink-200' },
  food:      { bg: 'bg-orange-100', text: 'text-orange-600', ring: 'ring-orange-200' },
  lifestyle: { bg: 'bg-purple-100', text: 'text-purple-600', ring: 'ring-purple-200' },
  fitness:   { bg: 'bg-green-100',  text: 'text-green-600',  ring: 'ring-green-200' },
  travel:    { bg: 'bg-sky-100',    text: 'text-sky-600',    ring: 'ring-sky-200' },
}

const DEFAULT_COLORS = { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' }

const SIZE_CLASSES: Record<AvatarSize, { wrapper: string; text: string }> = {
  sm: { wrapper: 'h-8 w-8',  text: 'text-xs' },
  md: { wrapper: 'h-9 w-9',  text: 'text-xs' },
  lg: { wrapper: 'h-12 w-12', text: 'text-sm' },
}

function getNicheColors(categories: string[] = []) {
  for (const cat of categories) {
    const key = cat.toLowerCase()
    if (NICHE_COLORS[key]) return NICHE_COLORS[key]
  }
  return DEFAULT_COLORS
}

export function InfluencerAvatar({
  username,
  categories,
  size = 'md',
  className,
}: InfluencerAvatarProps) {
  const letter = username.replace(/^@/, '')[0]?.toUpperCase() ?? '?'
  const colors = getNicheColors(categories)
  const sizes = SIZE_CLASSES[size]

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-center rounded-full ring-2',
        sizes.wrapper,
        colors.bg,
        colors.text,
        colors.ring,
        className,
      )}
    >
      <span className={cn('font-bold', sizes.text)}>{letter}</span>
    </div>
  )
}
