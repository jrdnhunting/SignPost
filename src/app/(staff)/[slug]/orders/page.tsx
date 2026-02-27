export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { WorkOrderStatusBadge, WorkOrderPriorityBadge } from "@/components/staff/work-order-status-badge"
import { WorkOrderSearch } from "@/components/staff/work-order-search"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import { formatDate, formatAddress, formatClientName, formatOrderId } from "@/lib/utils"
import { WO_STATUS_LABELS } from "@/lib/constants"

const STATUS_KEYS = [
  "PENDING",
  "CONFIRMED",
  "PENDING_INSTALLATION",
  "INSTALLED",
  "PENDING_REMOVAL",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
] as const

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { slug } = await params
  const { status, q } = await searchParams

  const org = await prisma.organization.findUniqueOrThrow({ where: { slug } })

  const numericQ = q && /^\d+$/.test(q.trim()) ? parseInt(q.trim(), 10) : null

  const workOrders = await prisma.workOrder.findMany({
    where: {
      organizationId: org.id,
      ...(status ? { status: status as any } : {}),
      ...(q
        ? {
            OR: [
              ...(numericQ !== null ? [{ orderId: numericQ }] : []),
              { addressLine1: { contains: q, mode: "insensitive" as const } },
              { addressLine2: { contains: q, mode: "insensitive" as const } },
              { city: { contains: q, mode: "insensitive" as const } },
              { postalCode: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: { client: true },
    orderBy: { orderId: "desc" },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Button asChild>
          <Link href={`/${slug}/orders/new`}>+ New Order</Link>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Suspense fallback={null}>
          <WorkOrderSearch slug={slug} />
        </Suspense>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        <Link
          href={`/${slug}/orders${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
            !status
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All
        </Link>
        {STATUS_KEYS.map((s) => (
          <Link
            key={s}
            href={`/${slug}/orders?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              status === s
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {WO_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {workOrders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">{q ? `No orders match "${q}".` : "No orders found."}</p>
          {!q && (
            <Button asChild variant="outline">
              <Link href={`/${slug}/orders/new`}>Create your first order</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Order ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Address</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Priority</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Scheduled Install</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/${slug}/orders/${wo.id}`}
                      className="font-mono font-semibold text-blue-600 hover:underline"
                    >
                      #{formatOrderId(wo.orderId)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatClientName(wo.client)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatAddress(wo)}
                  </td>
                  <td className="px-4 py-3">
                    <WorkOrderStatusBadge status={wo.status} />
                  </td>
                  <td className="px-4 py-3">
                    <WorkOrderPriorityBadge priority={wo.priority} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(wo.scheduledDate)}
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
