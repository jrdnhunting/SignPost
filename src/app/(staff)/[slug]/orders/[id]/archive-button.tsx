"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { archiveWorkOrder, unarchiveWorkOrder } from "@/actions/work-orders"

export function ArchiveButton({
  workOrderId,
  orgSlug,
  isArchived,
}: {
  workOrderId: string
  orgSlug: string
  isArchived: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleClick() {
    if (isArchived) {
      startTransition(async () => {
        await unarchiveWorkOrder(workOrderId, orgSlug)
        router.refresh()
      })
      return
    }
    setConfirming(true)
  }

  function handleConfirm() {
    setConfirming(false)
    startTransition(async () => {
      await archiveWorkOrder(workOrderId, orgSlug)
      router.push(`/${orgSlug}/orders`)
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Archive this order?</span>
        <Button size="sm" variant="destructive" onClick={handleConfirm} disabled={isPending}>
          Yes, archive
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={isArchived ? "text-green-700 hover:text-green-800" : "text-gray-500 hover:text-red-600"}
    >
      {isPending ? "…" : isArchived ? "Unarchive" : "Archive"}
    </Button>
  )
}
