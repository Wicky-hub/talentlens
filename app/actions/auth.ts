'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export type AuthResult = { error?: string; checkEmail?: boolean }

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'Email not confirmed': 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
  'User already registered': 'อีเมลนี้ถูกใช้งานแล้ว',
  'Password should be at least 6 characters': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
  'Unable to validate email address: invalid format': 'รูปแบบอีเมลไม่ถูกต้อง',
}

function translateError(msg: string): string {
  return ERROR_MAP[msg] ?? msg
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: translateError(error.message) }

  redirect('/dashboard')
}

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string
  const companyName = (formData.get('company_name') as string).trim()

  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { company_name: companyName } },
  })

  if (error) return { error: translateError(error.message) }

  // session is null when email confirmation is required
  if (!data.session) return { checkEmail: true }

  redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
