import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function HomePage() {
  // In demo mode skip the Supabase round-trip and go straight to the dashboard.
  if (process.env.DEMO_MODE === 'true') {
    redirect('/dashboard')
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  redirect(user ? '/dashboard' : '/login')
}
