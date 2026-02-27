"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updateOrgSettings } from "@/actions/settings"

interface Props {
  orgId: string
  orgSlug: string
  outOfServiceAreaMessage: string | null
}

export function WorkOrderPreferencesForm({ orgId, orgSlug, outOfServiceAreaMessage }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState(outOfServiceAreaMessage ?? "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await updateOrgSettings(orgId, { outOfServiceAreaMessage: message || undefined }, orgSlug)
      setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="oosMessage">Out-of-Service-Area Message for Clients</Label>
        <p className="text-xs text-gray-500">
          Shown to portal clients when their address is outside all defined service zones.
        </p>
        <Textarea
          id="oosMessage"
          rows={3}
          placeholder="This address is outside our current service area. Please contact us for assistance."
          value={message}
          onChange={(e) => { setMessage(e.target.value); setSaved(false) }}
        />
      </div>
      <p className="text-xs text-gray-400 italic">Additional work order preferences coming soon.</p>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        {saved && <p className="text-sm text-green-600">Saved!</p>}
      </div>
    </form>
  )
}
