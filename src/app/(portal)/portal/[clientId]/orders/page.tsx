export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate, formatAddress, formatOrderId } from "@/lib/utils"
import { WO_STATUS_LABELS, WO_STATUS_COLORS } from "@/lib/constants"

export default async function PortalOrdersPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params

  const workOrders = await prisma.workOrder.findMany({
    where: { clientId, archivedAt: null },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
        <Button asChild>
          <Link href={`/portal/${clientId}/orders/new`}>+ New Order</Link>
        </Button>
      </div>

      {workOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet.</p>
          <Button asChild variant="outline">
            <Link href={`/portal/${clientId}/orders/new`}>
              Submit your first order
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {workOrders.map((wo) => (
            <Link
              key={wo.id}
              href={`/portal/${clientId}/orders/${wo.id}`}
              className="block bg-white rounded-lg border p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    Order #{formatOrderId(wo.orderId)}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatAddress(wo)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted {formatDate(wo.createdAt)}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                    WO_STATUS_COLORS[wo.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {WO_STATUS_LABELS[wo.status] ?? wo.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
