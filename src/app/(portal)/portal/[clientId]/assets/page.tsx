export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { formatAssetCategory, formatAddress, formatOrderId } from "@/lib/utils"

const CATEGORY_COLORS: Record<string, string> = {
  SIGN_PANEL: "bg-blue-100 text-blue-700",
  SIGN_RIDER: "bg-purple-100 text-purple-700",
  INFO_BOX:   "bg-yellow-100 text-yellow-700",
  YARD_SIGN:  "bg-green-100 text-green-700",
}

export default async function PortalAssetsPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params

  const assets = await prisma.clientAsset.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: {
      locationWorkOrder: {
        select: { orderId: true, addressLine1: true, addressLine2: true, city: true, state: true, postalCode: true },
      },
      locationUser: { select: { name: true } },
    },
  })

  function locationDisplay(asset: (typeof assets)[number]): string {
    if (asset.locationWorkOrder) {
      return `Order #${formatOrderId(asset.locationWorkOrder.orderId)} — ${formatAddress(asset.locationWorkOrder)}`
    }
    if (asset.locationUser) {
      return `Stored with ${asset.locationUser.name}`
    }
    return asset.locationLabel || "Org storage"
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">My Assets</h1>

      {assets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <p className="text-gray-500">No assets on file.</p>
          <p className="text-sm text-gray-400 mt-1">
            Contact your sign company if you believe this is an error.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Qty</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Current Location</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assets.map((asset) => (
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
                  <td className="px-4 py-3 text-right">{asset.quantity}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{locationDisplay(asset)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
