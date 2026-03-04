"use client"

import { startClientMasquerade } from "@/actions/masquerade"
import { useTransition } from "react"

interface MasqueradeButtonProps {
  clientId: string
  clientName: string
  orgId: string
}

export default function MasqueradeButton({ clientId, clientName, orgId }: MasqueradeButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await startClientMasquerade(clientId, clientName, orgId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
    >
      {isPending ? "Loading…" : "View Portal"}
    </button>
  )
}
