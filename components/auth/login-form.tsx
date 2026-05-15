'use client'

import { useTransition, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loginAction } from '@/app/actions/auth'
import type { Translations } from '@/lib/i18n'

interface LoginFormProps {
  t: Translations['auth']
}

export function LoginForm({ t }: LoginFormProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
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

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={pending}>
        {pending ? t.loggingIn : t.loginButton}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.noAccount}{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t.signUp}
        </Link>
      </p>
    </form>
  )
}
