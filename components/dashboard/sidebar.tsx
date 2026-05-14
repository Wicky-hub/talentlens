'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Megaphone, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/i18n/locale-provider'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useLocale()

  const NAV_ITEMS = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/influencers', label: t.nav.influencers, icon: Users },
    { href: '/campaigns', label: t.nav.campaigns, icon: Megaphone },
    { href: '/reports', label: t.nav.reports, icon: FileText },
  ]

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-card px-3 py-6">
      <div className="mb-8 px-3">
        <span className="text-xl font-bold text-primary">TalentLens</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t pt-4">
        <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t.language.label}
        </p>
        <LanguageSwitcher />
      </div>
    </aside>
  )
}
