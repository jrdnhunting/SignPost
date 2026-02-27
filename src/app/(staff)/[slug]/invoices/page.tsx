export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { formatDate, formatCurrency } from "@/lib/utils"
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from "@/lib/constants"

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const org = await prisma.organization.findUniqueOrThrow({ where: { slug } })

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: org.id },
    include: { client: true, workOrder: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>No invoices yet. Create one from a work order detail page.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Work Order
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/${slug}/invoices/${inv.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inv.client.companyName}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {inv.workOrder ? (
                      <Link
                        href={`/${slug}/orders/${inv.workOrderId}`}
                        className="text-blue-600 hover:underline"
                      >
                        Order #{inv.workOrder.orderId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        INVOICE_STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(Number(inv.total))}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(inv.dueAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
