export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { formatCurrency, formatDate, formatOrderId, formatClientName } from "@/lib/utils"
import { WorkOrderStatusBadge } from "@/components/staff/work-order-status-badge"
import ClockWidget from "@/components/technician/clock-widget"
import PhotoUpload from "@/components/technician/photo-upload"

export default async function TechAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const userId = session!.user.userId

  // Verify assignment exists for this tech
  const assignment = await prisma.assignment.findUnique({
    where: { workOrderId_userId: { workOrderId: id, userId } },
  })
  if (!assignment) notFound()

  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      client: true,
      serviceArea: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  })
  if (!wo) notFound()

  // Find open work log for this user+workOrder
  const activeLog = await prisma.workLog.findFirst({
    where: { workOrderId: id, userId, endedAt: null },
    select: { id: true, startedAt: true },
  })

  return (
    <div className="space-y-4">
      <Link
        href="/technician/assignments"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to Assignments
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Order #{formatOrderId(wo.orderId)}
            </h1>
            <p className="text-sm text-gray-500">{formatClientName(wo.client)}</p>
          </div>
          <WorkOrderStatusBadge status={wo.status} />
        </div>
        <div className="mt-3 text-sm text-gray-700">
          <p className="font-medium">
            {wo.addressLine1}
            {wo.addressLine2 ? `, ${wo.addressLine2}` : ""}
          </p>
          <p>
            {wo.city}, {wo.state} {wo.postalCode}
          </p>
          {wo.serviceArea && (
            <p className="mt-1 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Service Area:</span>{" "}
              {wo.serviceArea.name}
            </p>
          )}
          {wo.locationNotes && (
            <p className="mt-1 text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
              📍 {wo.locationNotes}
            </p>
          )}
          {wo.listingGoLiveDate && (
            <p className="mt-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Listing Go-Live:</span> {formatDate(wo.listingGoLiveDate)}
            </p>
          )}
          {wo.orderNotes && (
            <p className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded p-2">
              <span className="font-medium">Order Notes:</span> {wo.orderNotes}
            </p>
          )}
          {wo.client.clientNotesPublic && (
            <p className="mt-2 text-xs text-gray-600 bg-gray-50 border rounded p-2">
              <span className="font-medium">Client Notes:</span> {wo.client.clientNotesPublic}
            </p>
          )}
          {wo.client.clientNotesPrivate && (
            <p className="mt-2 text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded p-2">
              <span className="font-medium">Client Notes (Private):</span> {wo.client.clientNotesPrivate}
            </p>
          )}
        </div>
      </div>

      {/* Clock In/Out */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Time Tracking</h2>
        <ClockWidget
          workOrderId={id}
          userId={userId}
          activeLog={
            activeLog
              ? { id: activeLog.id, startedAt: activeLog.startedAt }
              : null
          }
        />
      </div>

      {/* Items */}
      {wo.items.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Work Items</h2>
          <div className="divide-y text-sm">
            {wo.items.map((item) => (
              <div key={item.id} className="py-2 flex justify-between">
                <span>
                  {item.description} × {item.quantity}
                </span>
                <span className="text-gray-500">
                  {formatCurrency(item.quantity * Number(item.unitPrice))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Upload */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Photos</h2>
        <PhotoUpload workOrderId={id} uploadedById={userId} />
      </div>
    </div>
  )
}
