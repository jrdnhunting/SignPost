export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { formatAddress, formatClientName } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WO_STATUS_COLORS, WO_STATUS_LABELS } from "@/lib/constants"
import Link from "next/link"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const org = await prisma.organization.findUniqueOrThrow({ where: { slug } })

  const [totalOrders, pendingOrders, activeOrders, clients, invoices] =
    await Promise.all([
      prisma.workOrder.count({ where: { organizationId: org.id } }),
      prisma.workOrder.count({
        where: { organizationId: org.id, status: "PENDING" },
      }),
      prisma.workOrder.count({
        where: {
          organizationId: org.id,
          status: { in: ["CONFIRMED", "PENDING_INSTALLATION", "INSTALLED", "PENDING_REMOVAL"] },
        },
      }),
      prisma.client.count({ where: { organizationId: org.id } }),
      prisma.invoice.count({
        where: { organizationId: org.id, status: { in: ["SENT", "PARTIAL"] } },
      }),
    ])

  const recentOrders = await prisma.workOrder.findMany({
    where: { organizationId: org.id },
    include: { client: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{pendingOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-500">{activeOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Open Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{invoices}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link
            href={`/${slug}/orders`}
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {recentOrders.map((wo) => (
              <div key={wo.id} className="py-3 flex items-center justify-between">
                <div>
                  <Link
                    href={`/${slug}/orders/${wo.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {formatAddress(wo)}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {formatClientName(wo.client)}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    WO_STATUS_COLORS[wo.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {WO_STATUS_LABELS[wo.status] ?? wo.status}
                </span>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="py-4 text-gray-500 text-sm text-center">
                No orders yet.{" "}
                <Link
                  href={`/${slug}/orders/new`}
                  className="text-blue-600 hover:underline"
                >
                  Create one
                </Link>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
