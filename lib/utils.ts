import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('th-TH')
}

export function formatEngagementRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}

/** Map a TalentScore (0–100) to a Thai label */
export function talentScoreLabel(score: number): string {
  if (score >= 80) return 'ยอดเยี่ยม'
  if (score >= 60) return 'ดีมาก'
  if (score >= 40) return 'ดี'
  if (score >= 20) return 'พอใช้'
  return 'ต้องปรับปรุง'
}
