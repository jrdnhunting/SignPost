export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { formatDate, formatAddress, formatOrderId, formatClientName } from "@/lib/utils"
import { WO_STATUS_COLORS, WO_STATUS_LABELS } from "@/lib/constants"

export default async function TechAssignmentsPage() {
  const session = await auth()
  const userId = session!.user.userId

  const assignments = await prisma.assignment.findMany({
    where: {
      userId,
      status: { in: ["PENDING", "ACCEPTED"] },
      workOrder: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    },
    include: {
      workOrder: {
        include: { client: true },
      },
    },
    orderBy: { assignedAt: "desc" },
  })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">My Assignments</h1>

      {assignments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <p className="text-gray-500">No active assignments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Link
              key={a.id}
              href={`/technician/assignments/${a.workOrder.id}`}
              className="block bg-white rounded-lg border p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    Order #{formatOrderId(a.workOrder.orderId)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatClientName(a.workOrder.client)}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    WO_STATUS_COLORS[a.workOrder.status] ??
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {WO_STATUS_LABELS[a.workOrder.status] ?? a.workOrder.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {formatAddress(a.workOrder)}
              </p>
              {a.workOrder.scheduledDate && (
                <p className="text-xs text-gray-400 mt-1">
                  Install: {formatDate(a.workOrder.scheduledDate)}
                </p>
              )}
              {a.workOrder.scheduledRemovalDate && (
                <p className="text-xs text-gray-400">
                  Removal: {formatDate(a.workOrder.scheduledRemovalDate)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
