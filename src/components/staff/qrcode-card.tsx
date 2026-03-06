"use client"

import { useEffect, useState, useTransition } from "react"
import QRCode from "qrcode"
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
import { updateQRCode, deleteQRCode } from "@/actions/qrcodes"
import { Pencil, Trash2, Check, X, Download, ExternalLink } from "lucide-react"
import type { QRCodeData } from "@/app/(staff)/[slug]/qrcodes/qrcodes-client"

interface Props {
  qr: QRCodeData
  orgSlug: string
  baseUrl: string
  clients: { id: string; label: string }[]
  onDeleted: (id: string) => void
  onUpdated: (qr: QRCodeData) => void
}

export function QRCodeCard({ qr, orgSlug, baseUrl, clients, onDeleted, onUpdated }: Props) {
  const redirectUrl = `${baseUrl}/qr/${qr.code}`
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(qr.name)
  const [editTargetUrl, setEditTargetUrl] = useState(qr.targetUrl)
  const [editScope, setEditScope] = useState<"global" | "client">(qr.clientId ? "client" : "global")
  const [editClientId, setEditClientId] = useState(qr.clientId ?? "")

  useEffect(() => {
    QRCode.toDataURL(redirectUrl, { width: 200, margin: 2 }).then(setDataUrl).catch(() => {})
  }, [redirectUrl])

  function handleSave() {
    if (!editName.trim() || !editTargetUrl.trim()) return
    if (editScope === "client" && !editClientId) return
    startTransition(async () => {
      const updated = await updateQRCode(
        qr.id,
        { name: editName.trim(), targetUrl: editTargetUrl.trim(), clientId: editScope === "client" ? editClientId : null },
        orgSlug
      )
      const chosenClient = clients.find((c) => c.id === updated.clientId)
      onUpdated({ ...updated, clientLabel: chosenClient?.label ?? null })
      setEditing(false)
    })
  }

  function handleDelete() {
    if (!confirm(`Delete QR code "${qr.name}"?`)) return
    startTransition(async () => {
      await deleteQRCode(qr.id, orgSlug)
      onDeleted(qr.id)
    })
  }

  function cancelEdit() {
    setEditing(false)
    setEditName(qr.name)
    setEditTargetUrl(qr.targetUrl)
    setEditScope(qr.clientId ? "client" : "global")
    setEditClientId(qr.clientId ?? "")
  }

  return (
    <div className="border rounded-lg p-4 bg-white space-y-3">
      {editing ? (
        <div className="space-y-2">
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" className="h-8 text-sm font-medium" autoFocus />
          <Input type="url" value={editTargetUrl} onChange={(e) => setEditTargetUrl(e.target.value)} placeholder="https://example.com" className="h-8 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Scope</Label>
              <Select value={editScope} onValueChange={(v) => { setEditScope(v as "global" | "client"); setEditClientId("") }}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editScope === "client" && (
              <div className="space-y-1">
                <Label className="text-xs">Client</Label>
                <Select value={editClientId} onValueChange={setEditClientId}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
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
            <Button size="sm" onClick={handleSave} disabled={isPending || !editName.trim() || !editTargetUrl.trim() || (editScope === "client" && !editClientId)}>
              <Check className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{qr.name}</p>
            <a href={qr.targetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              {qr.targetUrl.length > 38 ? qr.targetUrl.slice(0, 38) + "…" : qr.targetUrl}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
            <p className="text-xs text-gray-400 mt-0.5">
              {qr.clientId ? `Client: ${qr.clientLabel}` : "Global"}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 text-gray-400" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        {dataUrl ? (
          <img src={dataUrl} alt={`QR code for ${qr.name}`} className="w-36 h-36" />
        ) : (
          <div className="w-36 h-36 bg-gray-100 rounded animate-pulse" />
        )}
        <p className="text-xs text-gray-400 text-center break-all">{redirectUrl}</p>
        {dataUrl && (
          <a href={dataUrl} download={`${qr.name.toLowerCase().replace(/\s+/g, "-")}-qr.png`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <Download className="h-3 w-3" /> Download PNG
          </a>
        )}
      </div>
    </div>
  )
}
