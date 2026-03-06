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

export function QRCodeRow({ qr, orgSlug, baseUrl, clients, onDeleted, onUpdated }: Props) {
  const redirectUrl = `${baseUrl}/qr/${qr.code}`
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(qr.name)
  const [editTargetUrl, setEditTargetUrl] = useState(qr.targetUrl)
  const [editScope, setEditScope] = useState<"global" | "client">(qr.clientId ? "client" : "global")
  const [editClientId, setEditClientId] = useState(qr.clientId ?? "")

  useEffect(() => {
    QRCode.toDataURL(redirectUrl, { width: 80, margin: 1 }).then(setDataUrl).catch(() => {})
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

  if (editing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-2" colSpan={5}>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 text-sm w-40" autoFocus />
            </div>
            <div className="space-y-1 flex-1 min-w-48">
              <Label className="text-xs">Destination URL</Label>
              <Input type="url" value={editTargetUrl} onChange={(e) => setEditTargetUrl(e.target.value)} className="h-7 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Scope</Label>
              <Select value={editScope} onValueChange={(v) => { setEditScope(v as "global" | "client"); setEditClientId("") }}>
                <SelectTrigger className="h-7 text-sm w-28"><SelectValue /></SelectTrigger>
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
                  <SelectTrigger className="h-7 text-sm w-44"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-1 pb-0.5">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}
                disabled={isPending || !editName.trim() || !editTargetUrl.trim() || (editScope === "client" && !editClientId)}>
                <Check className="h-3.5 w-3.5 text-green-600" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                <X className="h-3.5 w-3.5 text-gray-400" />
              </Button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="bg-white hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">{qr.name}</td>
      <td className="px-4 py-3">
        <a href={qr.targetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          {qr.targetUrl.length > 50 ? qr.targetUrl.slice(0, 50) + "…" : qr.targetUrl}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      </td>
      <td className="px-4 py-3">
        {qr.clientId ? (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {qr.clientLabel}
          </span>
        ) : (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
            Global
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {dataUrl ? (
          <div className="flex flex-col items-center gap-1">
            <img src={dataUrl} alt="" className="w-10 h-10 mx-auto" />
            <a href={dataUrl} download={`${qr.name.toLowerCase().replace(/\s+/g, "-")}-qr.png`} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
              <Download className="h-2.5 w-2.5" /> PNG
            </a>
          </div>
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded animate-pulse mx-auto" />
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1 justify-end">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5 text-gray-400" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleDelete} disabled={isPending}>
            <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
