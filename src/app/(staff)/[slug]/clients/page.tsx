export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const org = await prisma.organization.findUniqueOrThrow({ where: { slug } })

  const clients = await prisma.client.findMany({
    where: { organizationId: org.id },
    include: { _count: { select: { workOrders: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Button asChild>
          <Link href={`/${slug}/clients/new`}>+ Add Client</Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">No clients yet.</p>
          <Button asChild variant="outline">
            <Link href={`/${slug}/clients/new`}>Add your first client</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Company / Brokerage</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Work Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/${slug}/clients/${client.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {client.firstName} {client.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {client.companyName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{client.email}</td>
                  <td className="px-4 py-3 text-gray-600">{client.phone}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {client._count.workOrders}
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
