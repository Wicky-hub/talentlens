import Link from 'next/link'
import { getLocale } from '@/lib/locale'
import { getTranslation } from '@/lib/i18n'
import { NewCampaignForm } from '@/components/campaigns/new-campaign-form'

export default async function NewCampaignPage() {
  const locale = await getLocale()
  const t = getTranslation(locale)

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/campaigns"
          className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          {t.newCampaign.backToCampaigns}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{t.newCampaign.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.newCampaign.subtitle}</p>
      </div>

      <NewCampaignForm t={t.newCampaign} nicheLabels={nicheLabels} />
    </div>
  )
}
