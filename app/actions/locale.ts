'use server'

import { cookies } from 'next/headers'
import type { Locale } from '@/lib/i18n'

export async function setLocale(locale: Locale): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('talentlens-locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}
