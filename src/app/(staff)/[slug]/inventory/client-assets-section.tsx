"use client"
import { useState, useTransition } from "react"
import { deleteClientAsset } from "@/actions/client-assets"
import { AddClientAssetForm } from "./add-client-asset-form"
import { MoveAssetForm } from "./move-asset-form"
import { formatAssetCategory, formatAddress, formatOrderId, formatClientName } from "@/lib/utils"

type Asset = {
  id: string
  name: string
  category: string
  quantity: number
  description: string | null
  notes: string | null
  locationLabel: string | null
  client: { id: string; firstName: string; lastName: string; companyName: string | null }
  locationWorkOrder: {
    id: string
    orderId: number
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    postalCode: string
  } | null
  locationUser: { id: string; name: string } | null
}

interface ClientAssetsSectionProps {
  organizationId: string
  orgSlug: string
  assets: Asset[]
  clients: { id: string; firstName: string; lastName: string; companyName: string | null }[]
  technicians: { id: string; name: string }[]
  activeWorkOrders: {
    id: string
    orderId: number
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    postalCode: string
  }[]
}

const CATEGORY_COLORS: Record<string, string> = {
  SIGN_PANEL: "bg-blue-100 text-blue-700",
  SIGN_RIDER: "bg-purple-100 text-purple-700",
  INFO_BOX:   "bg-yellow-100 text-yellow-700",
  YARD_SIGN:  "bg-green-100 text-green-700",
}

function locationLabel(asset: Asset): string {
  if (asset.locationWorkOrder) {
    return `#${formatOrderId(asset.locationWorkOrder.orderId)} — ${formatAddress(asset.locationWorkOrder)}`
  }
  if (asset.locationUser) {
    return `Stored with ${asset.locationUser.name}`
  }
  return asset.locationLabel || "Org storage"
}

export function ClientAssetsSection({
  organizationId,
  orgSlug,
  assets,
  clients,
  technicians,
  activeWorkOrders,
}: ClientAssetsSectionProps) {
  const [filterClient, setFilterClient] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [, startTransition] = useTransition()

  const filtered = assets.filter((a) => {
    if (filterClient && a.client.id !== filterClient) return false
    if (filterCategory && a.category !== filterCategory) return false
    return true
  })

  function handleDelete(id: string) {
    if (!confirm("Delete this asset? This cannot be undone.")) return
    startTransition(() => deleteClientAsset(id, orgSlug))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {formatClientName(c)}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All categories</option>
          {["SIGN_PANEL", "SIGN_RIDER", "INFO_BOX", "YARD_SIGN"].map((cat) => (
            <option key={cat} value={cat}>
              {formatAssetCategory(cat)}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <AddClientAssetForm
            organizationId={organizationId}
            orgSlug={orgSlug}
            clients={clients}
            technicians={technicians}
            activeWorkOrders={activeWorkOrders}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">No client assets found.</p>
          <AddClientAssetForm
            organizationId={organizationId}
            orgSlug={orgSlug}
            clients={clients}
            technicians={technicians}
            activeWorkOrders={activeWorkOrders}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Qty</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Current Location</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        CATEGORY_COLORS[asset.category] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {formatAssetCategory(asset.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {asset.name}
                    {asset.description && (
                      <p className="text-xs text-gray-400 font-normal">{asset.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatClientName(asset.client)}</td>
                  <td className="px-4 py-3 text-right">{asset.quantity}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{locationLabel(asset)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <MoveAssetForm
                        assetId={asset.id}
                        assetName={asset.name}
                        orgSlug={orgSlug}
                        technicians={technicians}
                        activeWorkOrders={activeWorkOrders}
                      />
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
