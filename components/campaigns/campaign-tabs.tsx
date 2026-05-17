'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CampaignTabsProps {
  currentTab: 'all' | 'mine'
  labelAll: string
  labelMine: string
}

export function CampaignTabs({ currentTab, labelAll, labelMine }: CampaignTabsProps) {
  return (
    <div className="inline-flex rounded-lg border bg-muted/30 p-1 gap-1">
      <Link
        href="/campaigns"
        className={cn(
          'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
          currentTab === 'all'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {labelAll}
      </Link>
      <Link
        href="/campaigns?tab=mine"
        className={cn(
          'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
          currentTab === 'mine'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {labelMine}
      </Link>
    </div>
  )
}
