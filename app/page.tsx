import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createServerClient()
  // getSession() reads cookies only — safe from Server Components.
  // Middleware already validated the JWT via getUser() on every request.
  const { data: { session } } = await supabase.auth.getSession()

  redirect(session?.user ? '/dashboard' : '/login')
}
