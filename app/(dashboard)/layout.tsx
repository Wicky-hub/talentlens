import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  // getSession() reads cookies only — safe from Server Components.
  // Middleware already validated the JWT via getUser() on every request.
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-muted/10 p-6">{children}</main>
    </div>
  )
}
