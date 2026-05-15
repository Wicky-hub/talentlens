'use client'

import { useTransition, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { registerAction } from '@/app/actions/auth'
import type { Translations } from '@/lib/i18n'

interface RegisterFormProps {
  t: Translations['auth']
}

export function RegisterForm({ t }: RegisterFormProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm = formData.get('confirm_password') as string

    if (password !== confirm) {
      setError(t.passwordMismatch)
      return
    }

    startTransition(async () => {
      const result = await registerAction(formData)
      if (result?.error) setError(result.error)
      if (result?.checkEmail) setCheckEmail(true)
    })
  }

  if (checkEmail) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t.checkEmail}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{t.checkEmailDesc}</p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          {t.backToLogin}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="company_name">
          {t.companyName}
        </label>
        <Input
          id="company_name"
          name="company_name"
          type="text"
          placeholder={t.companyPlaceholder}
          autoComplete="organization"
          required
          disabled={pending}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          {t.email}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t.emailPlaceholder}
          autoComplete="email"
          required
          disabled={pending}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="password">
          {t.password}
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t.passwordPlaceholder}
            autoComplete="new-password"
            minLength={6}
            required
            disabled={pending}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="confirm_password">
          {t.confirmPassword}
        </label>
        <div className="relative">
          <Input
            id="confirm_password"
            name="confirm_password"
            type={showConfirm ? 'text' : 'password'}
            placeholder={t.passwordPlaceholder}
            autoComplete="new-password"
            minLength={6}
            required
            disabled={pending}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={pending}>
        {pending ? t.registering : t.registerButton}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.hasAccount}{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t.signIn}
        </Link>
      </p>
    </form>
  )
}
