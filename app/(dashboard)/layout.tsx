import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read env var inside the function so it is evaluated per-request,
  // not frozen at module-load time. Set DEMO_MODE=true in Vercel env vars
  // to bypass auth for demos; remove it to re-enable auth instantly.
  if (process.env.DEMO_MODE !== 'true') {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-muted/10 p-6">{children}</main>
    </div>
  )
}
