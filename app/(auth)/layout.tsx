import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  // getSession() reads cookies only — safe from Server Components.
  // Middleware already validated the JWT via getUser() on every request.
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.user) redirect('/dashboard')

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4 py-12">
      {children}
    </main>
  )
}
