"use client"

import { stopMasquerade } from "@/actions/masquerade"
import { useTransition } from "react"
import { AlertTriangle } from "lucide-react"

interface MasqueradeBannerProps {
  clientName: string
  isSuperAdmin?: boolean
}

export default function MasqueradeBanner({ clientName, isSuperAdmin }: MasqueradeBannerProps) {
  const [isPending, startTransition] = useTransition()

  function handleStop() {
    startTransition(async () => {
      await stopMasquerade()
    })
  }

  const label = isSuperAdmin
    ? `Super Admin View — Viewing portal as "${clientName}"`
    : `Staff View — Viewing portal as "${clientName}"`

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-amber-400 px-4 py-2 text-amber-900">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </div>
      <button
        onClick={handleStop}
        disabled={isPending}
        className="rounded bg-amber-900 px-3 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-800 disabled:opacity-60"
      >
        {isPending ? "Returning…" : "Return to Staff View"}
      </button>
    </div>
  )
}
