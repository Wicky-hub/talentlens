import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'

// Set DEMO_MODE=true in Vercel environment variables to bypass auth for demos.
// Remove the variable (or set it to anything else) to re-enable auth instantly
// without a redeployment.
const DEMO_MODE = process.env.DEMO_MODE === 'true'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!DEMO_MODE) {
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
