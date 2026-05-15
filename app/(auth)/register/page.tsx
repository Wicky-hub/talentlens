import { getLocale } from '@/lib/locale'
import { getTranslation } from '@/lib/i18n'
import { RegisterForm } from '@/components/auth/register-form'

export default async function RegisterPage() {
  const locale = await getLocale()
  const t = getTranslation(locale)

  return (
    <div className="w-full max-w-md">
      {/* Brand header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <span className="text-xl font-bold">T</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">TalentLens</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.auth.registerSubtitle}</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border bg-card p-8 shadow-lg">
        <h2 className="mb-6 text-xl font-semibold">{t.auth.registerTitle}</h2>
        <RegisterForm t={t.auth} />
      </div>
    </div>
  )
}
