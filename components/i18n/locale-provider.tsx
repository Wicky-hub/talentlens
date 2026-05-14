'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { setLocale as setLocaleCookie } from '@/app/actions/locale'
import { getTranslation } from '@/lib/i18n'
import type { Locale, Translations } from '@/lib/i18n'

const STORAGE_KEY = 'talentlens-locale'

interface LocaleContextValue {
  locale: Locale
  t: Translations
  setLocale: (locale: Locale) => Promise<void>
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const router = useRouter()

  // On mount: sync localStorage → cookie if they diverge (e.g. cookie expired)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
      if (stored === 'th' || stored === 'en') {
        if (stored !== initialLocale) {
          setLocaleState(stored)
          setLocaleCookie(stored).then(() => router.refresh())
        }
      } else {
        localStorage.setItem(STORAGE_KEY, initialLocale)
      }
    } catch {
      // localStorage unavailable
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setLocale = useCallback(
    async (next: Locale) => {
      setLocaleState(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {}
      await setLocaleCookie(next)
      router.refresh()
    },
    [router],
  )

  const t = getTranslation(locale)

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
