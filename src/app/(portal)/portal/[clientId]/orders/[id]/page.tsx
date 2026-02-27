export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { formatDate, formatOrderId } from "@/lib/utils"
import { WO_STATUS_LABELS, WO_STATUS_COLORS } from "@/lib/constants"
import OrderStatusTimeline from "@/components/portal/order-status-timeline"
import { RemovalRequestDialog } from "@/components/portal/removal-request-dialog"

export default async function PortalOrderDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; id: string }>
}) {
  const { clientId, id } = await params

  const wo = await prisma.workOrder.findUnique({
    where: { id, clientId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { createdAt: "desc" } },
      client: { select: { clientNotesPublic: true } },
    },
  })
  if (!wo) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link
          href={`/portal/${clientId}/orders`}
          className="hover:text-blue-600"
        >
          My Orders
        </Link>
        <span>/</span>
        <span>Order #{formatOrderId(wo.orderId)}</span>
      </div>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Order #{formatOrderId(wo.orderId)}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {wo.addressLine1}
            {wo.addressLine2 ? `, ${wo.addressLine2}` : ""}, {wo.city},{" "}
            {wo.state} {wo.postalCode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RemovalRequestDialog workOrderId={wo.id} />
          <span
            className={`text-sm px-3 py-1 rounded-full font-medium ${
              WO_STATUS_COLORS[wo.status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {WO_STATUS_LABELS[wo.status] ?? wo.status}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Order details */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Order Details</h2>
            <div className="space-y-2 text-sm">
              {wo.listingGoLiveDate && (
                <div>
                  <span className="text-gray-500">Listing Go-Live: </span>
                  {formatDate(wo.listingGoLiveDate)}
                </div>
              )}
              {wo.orderNotes && (
                <div>
                  <span className="text-gray-500">Order Notes: </span>
                  {wo.orderNotes}
                </div>
              )}
              {wo.client.clientNotesPublic && (
                <div>
                  <span className="text-gray-500">Client Notes: </span>
                  {wo.client.clientNotesPublic}
                </div>
              )}
              {wo.scheduledDate && (
                <div>
                  <span className="text-gray-500">Scheduled Install: </span>
                  {formatDate(wo.scheduledDate)}
                </div>
              )}
              {wo.scheduledRemovalDate && (
                <div>
                  <span className="text-gray-500">Scheduled Removal: </span>
                  {formatDate(wo.scheduledRemovalDate)}
                </div>
              )}
              {wo.locationNotes && (
                <div>
                  <span className="text-gray-500">Access notes: </span>
                  {wo.locationNotes}
                </div>
              )}
              <div>
                <span className="text-gray-500">Submitted: </span>
                {formatDate(wo.createdAt)}
              </div>
            </div>
          </div>

          {/* Items */}
          {wo.items.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Items</h2>
              <div className="divide-y">
                {wo.items.map((item) => (
                  <div key={item.id} className="py-2 flex justify-between text-sm">
                    <span>
                      {item.description} × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {wo.photos.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Photos</h2>
              <div className="grid grid-cols-2 gap-3">
                {wo.photos.map((photo) => (
                  <div key={photo.id}>
                    <img
                      src={photo.url}
                      alt={photo.caption ?? "Photo"}
                      className="w-full h-36 object-cover rounded-md border"
                    />
                    <p className="text-xs text-gray-500 mt-1">{photo.context}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg border p-4 h-fit">
          <h2 className="font-semibold text-gray-900 mb-4">Status</h2>
          <OrderStatusTimeline
            status={wo.status}
            submittedAt={wo.createdAt}
            scheduledDate={wo.scheduledDate}
            completedAt={wo.completedAt}
          />
        </div>
      </div>
    </div>
  )
}
