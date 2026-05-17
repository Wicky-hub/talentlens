import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import type { Campaign } from '@/types'
import { getLocale } from '@/lib/locale'
import { getTranslation } from '@/lib/i18n'
import { CampaignForm } from '@/components/campaigns/campaign-form'
import { updateCampaignAction } from '@/app/actions/campaigns'

export const dynamic = 'force-dynamic'

export default async function EditCampaignPage({ params }: { params: { id: string } }) {
  const [locale, supabase] = await Promise.all([getLocale(), createServerClient()])
  const t = getTranslation(locale)

  const [
    { data: { user } },
    { data: campaignRow },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('campaigns').select('*').eq('id', params.id).single(),
  ])

  if (!campaignRow) notFound()

  const campaign = campaignRow as Campaign

  // Non-owners are bounced back to the detail page
  if (user?.id !== campaign.sme_id) redirect(`/campaigns/${params.id}`)

  const nicheLabels: Record<string, string> = {
    beauty:    t.newCampaign.catBeauty,
    food:      t.newCampaign.catFood,
    lifestyle: t.newCampaign.catLifestyle,
    fitness:   t.newCampaign.catFitness,
    travel:    t.newCampaign.catTravel,
    fashion:   t.newCampaign.catFashion,
    health:    t.newCampaign.catHealth,
    tech:      t.newCampaign.catTech,
  }

  // Bind campaign ID into the update action
  const boundUpdate = updateCampaignAction.bind(null, params.id)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/campaigns/${params.id}`}
          className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          {t.campaigns.backToDetail}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{t.newCampaign.editTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.newCampaign.editSubtitle}</p>
      </div>

      <CampaignForm
        t={t.newCampaign}
        nicheLabels={nicheLabels}
        mode="edit"
        campaign={campaign}
        submitAction={boundUpdate}
      />
    </div>
  )
}
