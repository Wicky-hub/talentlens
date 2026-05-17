'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteCampaignAction } from '@/app/actions/campaigns'

interface DeleteCampaignButtonProps {
  campaignId: string
  labels: {
    deleteButton: string
    deleteConfirmTitle: string
    deleteConfirmDesc: string
    deleteConfirmAction: string
    deleteCancelAction: string
    deleting: string
  }
}

export function DeleteCampaignButton({
  campaignId,
  labels: l,
}: DeleteCampaignButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteCampaignAction(campaignId)
      if (result?.error) {
        setError(result.error)
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-destructive hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        {l.deleteButton}
      </Button>

      {/* Confirm dialog overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !pending && setOpen(false)}
          />
          {/* Dialog */}
          <div className="relative z-10 w-full max-w-sm rounded-2xl border bg-card p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">{l.deleteConfirmTitle}</h2>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {l.deleteConfirmDesc}
            </p>
            {error && (
              <p className="mb-4 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                {l.deleteCancelAction}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={pending}
                onClick={handleDelete}
              >
                {pending ? l.deleting : l.deleteConfirmAction}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
