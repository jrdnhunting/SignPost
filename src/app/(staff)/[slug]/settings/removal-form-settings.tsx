"use client"
import { useState, useTransition } from "react"
import { updateOrgSettings } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface RemovalFormSettingsProps {
  orgId: string
  orgSlug: string
  initialValues: {
    removalFormText?: string | null
    removalFormUrl?: string | null
  }
}

export function RemovalFormSettings({
  orgId,
  orgSlug,
  initialValues,
}: RemovalFormSettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [removalFormText, setRemovalFormText] = useState(initialValues.removalFormText ?? "")
  const [removalFormUrl, setRemovalFormUrl] = useState(initialValues.removalFormUrl ?? "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    startTransition(async () => {
      await updateOrgSettings(
        orgId,
        {
          removalFormText: removalFormText.trim() || undefined,
          removalFormUrl: removalFormUrl.trim() || undefined,
        },
        orgSlug
      )
      setSaved(true)
    })
  }

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/removal-request/${orgSlug}`
    : `/removal-request/${orgSlug}`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
        <p className="font-medium mb-1">Public Removal Request Form URL</p>
        <p className="font-mono text-xs break-all">/removal-request/{orgSlug}</p>
        <p className="text-xs mt-1 text-blue-600">
          Share this link with agents who need to request sign removal without logging in.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="removal-form-text">Custom Message (shown at top of form)</Label>
        <Textarea
          id="removal-form-text"
          rows={3}
          value={removalFormText}
          onChange={(e) => setRemovalFormText(e.target.value)}
          placeholder="Optional: Instructions or information for agents requesting sign removal..."
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="removal-form-url">Additional Info URL (optional link shown on form)</Label>
        <Input
          id="removal-form-url"
          type="url"
          value={removalFormUrl}
          onChange={(e) => setRemovalFormUrl(e.target.value)}
          placeholder="https://example.com/removal-instructions"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">Saved!</span>
        )}
      </div>
    </form>
  )
}
