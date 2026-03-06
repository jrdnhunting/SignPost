"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createQRCode } from "@/actions/qrcodes"
import type { QRCodeData } from "@/app/(staff)/[slug]/qrcodes/qrcodes-client"

interface Props {
  orgId: string
  orgSlug: string
  clients: { id: string; label: string }[]
  onCreated: (qr: QRCodeData) => void
  onCancel: () => void
}

export function AddQRCodeForm({ orgId, orgSlug, clients, onCreated, onCancel }: Props) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [targetUrl, setTargetUrl] = useState("")
  const [scope, setScope] = useState<"global" | "client">("global")
  const [clientId, setClientId] = useState("")

  const canSubmit = name.trim() && targetUrl.trim() && (scope === "global" || clientId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    startTransition(async () => {
      const qr = await createQRCode(
        {
          organizationId: orgId,
          name: name.trim(),
          targetUrl: targetUrl.trim(),
          clientId: scope === "client" ? clientId : null,
        },
        orgSlug
      )
      const chosenClient = clients.find((c) => c.id === qr.clientId)
      onCreated({
        id: qr.id,
        name: qr.name,
        code: qr.code,
        targetUrl: qr.targetUrl,
        clientId: qr.clientId,
        clientLabel: chosenClient?.label ?? null,
      })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-4 bg-blue-50 space-y-3">
      <p className="text-sm font-semibold text-gray-700">New QR Code</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Open House Flyer"
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Destination URL *</Label>
          <Input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Scope</Label>
          <Select value={scope} onValueChange={(v) => { setScope(v as "global" | "client"); setClientId("") }}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {scope === "client" && (
          <div className="space-y-1">
            <Label className="text-xs">Client *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select client…" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || !canSubmit}>
          {isPending ? "Creating..." : "Create QR Code"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
