'use client'

import { useLocale } from '@/components/i18n/locale-provider'
import { cn } from '@/lib/utils'

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted p-1">
      <button
        onClick={() => setLocale('th')}
        className={cn(
          'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
          locale === 'th'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        ไทย
      </button>
      <button
        onClick={() => setLocale('en')}
        className={cn(
          'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
          locale === 'en'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        EN
      </button>
    </div>
  )
}
