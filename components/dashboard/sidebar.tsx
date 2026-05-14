import Link from 'next/link'
import { LayoutDashboard, Users, Megaphone, FileText } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { href: '/influencers', label: 'อินฟลูเอนเซอร์', icon: Users },
  { href: '/campaigns', label: 'แคมเปญ', icon: Megaphone },
  { href: '/reports', label: 'รายงาน', icon: FileText },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-card px-3 py-6">
      <div className="mb-8 px-3">
        <span className="text-xl font-bold text-primary">TalentLens</span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
