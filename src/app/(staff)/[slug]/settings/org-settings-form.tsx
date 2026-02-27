"use client"
import { useState, useTransition } from "react"
import { updateOrgName } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface OrgSettingsFormProps {
  orgId: string
  orgSlug: string
  currentName: string
}

export function OrgSettingsForm({ orgId, orgSlug, currentName }: OrgSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(currentName)
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await updateOrgName(orgId, name, orgSlug)
      setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="org-name">Organization Name</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false) }}
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        {saved && <p className="text-sm text-green-600">Saved!</p>}
      </div>
    </form>
  )
}
