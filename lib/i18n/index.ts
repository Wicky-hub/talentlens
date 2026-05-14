import { translations } from './translations'

export type Locale = 'th' | 'en'
export type Translations = typeof translations.th

export function getTranslation(locale: Locale): Translations {
  return translations[locale]
}

export { translations }
