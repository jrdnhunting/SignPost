export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function SuperAdminPage() {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          memberships: true,
          clients: true,
          workOrders: true,
        },
      },
    },
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">All Organizations</h1>
      <div className="overflow-hidden rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Staff</th>
              <th className="px-4 py-3 text-right">Clients</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {orgs.map((org) => {
              const statusStyles: Record<string, string> = {
                TRIALING:  "bg-blue-900/60 text-blue-300",
                ACTIVE:    "bg-green-900/60 text-green-300",
                PAST_DUE:  "bg-red-900/60 text-red-300",
                PAUSED:    "bg-yellow-900/60 text-yellow-300",
                CANCELLED: "bg-gray-800 text-gray-500",
              }
              return (
              <tr key={org.id} className="bg-gray-900 hover:bg-gray-800/60">
                <td className="px-4 py-3 font-medium text-white">{org.name}</td>
                <td className="px-4 py-3 text-gray-400">
                  <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs">{org.slug}</code>
                </td>
                <td className="px-4 py-3 text-gray-300 text-sm capitalize">{org.plan}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${statusStyles[org.subscriptionStatus] ?? "bg-gray-800 text-gray-500"}`}>
                    {org.subscriptionStatus.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-300">{org._count.memberships}</td>
                <td className="px-4 py-3 text-right text-gray-300">{org._count.clients}</td>
                <td className="px-4 py-3 text-right text-gray-300">{org._count.workOrders}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {org.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/superadmin/${org.id}`}
                    className="rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-500"
                  >
                    → Manage
                  </Link>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
