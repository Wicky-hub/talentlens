'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import type { CampaignStatus, Platform } from '@/types'

export type CampaignFormResult = { error?: string }

export async function createCampaignAction(formData: FormData): Promise<CampaignFormResult> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อน' }

  const name = (formData.get('name') as string).trim()
  const brand = (formData.get('brand') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() ?? ''
  const budgetRaw = formData.get('budget') as string
  const budget = parseFloat(budgetRaw)
  const status = (formData.get('status') as CampaignStatus) ?? 'draft'
  const categories = formData.getAll('categories') as string[]
  const platforms = formData.getAll('platforms') as Platform[]
  const startDate = (formData.get('start_date') as string) || null
  const endDate = (formData.get('end_date') as string) || null

  if (!name) return { error: 'กรุณากรอกชื่อแคมเปญ' }
  if (!budgetRaw) return { error: 'กรุณากรอกงบประมาณ' }
  if (isNaN(budget) || budget <= 0) return { error: 'งบประมาณต้องมากกว่า 0' }
  if (categories.length === 0) return { error: 'กรุณาเลือกหมวดหมู่อย่างน้อย 1 รายการ' }
  if (platforms.length === 0) return { error: 'กรุณาเลือกแพลตฟอร์มอย่างน้อย 1 รายการ' }
  if (startDate && endDate && endDate < startDate) {
    return { error: 'วันสิ้นสุดต้องมาหลังวันเริ่มต้น' }
  }

  const { error } = await supabase.from('campaigns').insert({
    sme_id: user.id,
    name,
    brand,
    description,
    budget,
    status,
    target_categories: categories,
    target_platforms: platforms,
    start_date: startDate,
    end_date: endDate,
    target_location: null,
    min_followers: 1_000,
    max_followers: 2_147_483_647,
    min_talent_score: 0,
  })

  if (error) return { error: error.message }

  redirect('/campaigns')
}

export async function updateCampaignAction(
  id: string,
  formData: FormData,
): Promise<CampaignFormResult> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อน' }

  const name = (formData.get('name') as string).trim()
  const brand = (formData.get('brand') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() ?? ''
  const budgetRaw = formData.get('budget') as string
  const budget = parseFloat(budgetRaw)
  const status = (formData.get('status') as CampaignStatus) ?? 'draft'
  const categories = formData.getAll('categories') as string[]
  const platforms = formData.getAll('platforms') as Platform[]
  const startDate = (formData.get('start_date') as string) || null
  const endDate = (formData.get('end_date') as string) || null

  if (!name) return { error: 'กรุณากรอกชื่อแคมเปญ' }
  if (!budgetRaw) return { error: 'กรุณากรอกงบประมาณ' }
  if (isNaN(budget) || budget <= 0) return { error: 'งบประมาณต้องมากกว่า 0' }
  if (categories.length === 0) return { error: 'กรุณาเลือกหมวดหมู่อย่างน้อย 1 รายการ' }
  if (platforms.length === 0) return { error: 'กรุณาเลือกแพลตฟอร์มอย่างน้อย 1 รายการ' }
  if (startDate && endDate && endDate < startDate) {
    return { error: 'วันสิ้นสุดต้องมาหลังวันเริ่มต้น' }
  }

  const { error } = await supabase
    .from('campaigns')
    .update({
      name,
      brand,
      description,
      budget,
      status,
      target_categories: categories,
      target_platforms: platforms,
      start_date: startDate,
      end_date: endDate,
    })
    .eq('id', id)
    .eq('sme_id', user.id)

  if (error) return { error: error.message }

  redirect(`/campaigns/${id}`)
}

export async function deleteCampaignAction(id: string): Promise<CampaignFormResult> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อน' }

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)
    .eq('sme_id', user.id)

  if (error) return { error: error.message }

  redirect('/campaigns')
}
