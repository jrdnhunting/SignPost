"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { QRCodeCard } from "@/components/staff/qrcode-card"
import { QRCodeRow } from "@/components/staff/qrcode-row"
import { AddQRCodeForm } from "@/components/staff/add-qrcode-form"
import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"

export interface QRCodeData {
  id: string
  name: string
  code: string
  targetUrl: string
  clientId: string | null
  clientLabel: string | null
}

interface Props {
  orgId: string
  orgSlug: string
  initialQRCodes: QRCodeData[]
  clients: { id: string; label: string }[]
  baseUrl: string
}

export function QRCodesPageClient({ orgId, orgSlug, initialQRCodes, clients, baseUrl }: Props) {
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>(initialQRCodes)
  const [showAddForm, setShowAddForm] = useState(false)
  const [view, setView] = useState<"list" | "grid">("list")

  function handleCreated(qr: QRCodeData) {
    setQRCodes((prev) => [qr, ...prev])
    setShowAddForm(false)
  }

  function handleDeleted(id: string) {
    setQRCodes((prev) => prev.filter((q) => q.id !== id))
  }

  function handleUpdated(updated: QRCodeData) {
    setQRCodes((prev) => prev.map((q) => q.id === updated.id ? updated : q))
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">QR Codes</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "px-2.5 py-1.5 transition-colors",
                view === "list" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "px-2.5 py-1.5 transition-colors border-l",
                view === "grid" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)}>New QR Code</Button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6">
          <AddQRCodeForm
            orgId={orgId}
            orgSlug={orgSlug}
            clients={clients}
            onCreated={handleCreated}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {qrCodes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12 border border-dashed rounded-lg">
          No QR codes yet. Create one to get started.
        </p>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {qrCodes.map((qr) => (
            <QRCodeCard
              key={qr.id}
              qr={qr}
              orgSlug={orgSlug}
              baseUrl={baseUrl}
              clients={clients}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Destination</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-32">Scope</th>
                <th className="px-4 py-2.5 text-center font-medium text-gray-600 w-24">QR</th>
                <th className="px-4 py-2.5 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {qrCodes.map((qr) => (
                <QRCodeRow
                  key={qr.id}
                  qr={qr}
                  orgSlug={orgSlug}
                  baseUrl={baseUrl}
                  clients={clients}
                  onDeleted={handleDeleted}
                  onUpdated={handleUpdated}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
