export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatDate, formatCurrency } from "@/lib/utils"
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from "@/lib/constants"
import { InvoiceStatusSelect } from "./invoice-status-select"
import { AddLineItemForm } from "./add-line-item-form"
import { RecordPaymentForm } from "./record-payment-form"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const org = await prisma.organization.findUniqueOrThrow({
    where: { slug },
    select: {
      id: true,
      name: true,
      phone: true,
      contactEmail: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      postalCode: true,
    },
  })

  const invoice = await prisma.invoice.findUnique({
    where: { id, organizationId: org.id },
    include: {
      client: true,
      workOrder: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidAt: "asc" } },
    },
  })
  if (!invoice) notFound()

  const totalPaid = invoice.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )
  const balance = Number(invoice.total) - totalPaid

  return (
    <div className="p-8 max-w-4xl">
      {/* Org Letterhead */}
      {(org.addressLine1 || org.phone || org.contactEmail) && (
        <div className="bg-gray-50 border rounded-md px-5 py-4 mb-6 text-sm">
          <p className="font-semibold text-gray-900">{org.name}</p>
          {org.addressLine1 && (
            <p className="text-gray-600">
              {org.addressLine1}
              {org.addressLine2 ? `, ${org.addressLine2}` : ""}
            </p>
          )}
          {(org.city || org.state || org.postalCode) && (
            <p className="text-gray-600">
              {[org.city, org.state, org.postalCode].filter(Boolean).join(", ")}
            </p>
          )}
          {org.phone && <p className="text-gray-600">{org.phone}</p>}
          {org.contactEmail && <p className="text-gray-600">{org.contactEmail}</p>}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href={`/${slug}/invoices`} className="hover:text-blue-600">
          Invoices
        </Link>
        <span>/</span>
        <span>{invoice.invoiceNumber}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {invoice.invoiceNumber}
          </h1>
          <p className="text-gray-500 mt-1">{invoice.client.companyName}</p>
        </div>
        <InvoiceStatusSelect
          invoiceId={invoice.id}
          currentStatus={invoice.status}
          orgSlug={slug}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Client</p>
                <Link
                  href={`/${slug}/clients/${invoice.clientId}`}
                  className="text-blue-600 hover:underline"
                >
                  {invoice.client.companyName}
                </Link>
              </div>
              {invoice.workOrder && (
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">
                    Work Order
                  </p>
                  <Link
                    href={`/${slug}/orders/${invoice.workOrderId}`}
                    className="text-blue-600 hover:underline"
                  >
                    Order #{invoice.workOrder.orderId}
                  </Link>
                </div>
              )}
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">
                  Due Date
                </p>
                <p>{formatDate(invoice.dueAt)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Issued</p>
                <p>{formatDate(invoice.issuedAt)}</p>
              </div>
            </div>
            {invoice.notes && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                {invoice.notes}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            {Number(invoice.taxAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>{formatCurrency(Number(invoice.taxAmount))}</span>
              </div>
            )}
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span className="text-red-600">
                  -{formatCurrency(Number(invoice.discountAmount))}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(Number(invoice.total))}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Paid</span>
              <span>{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Balance Due</span>
              <span className={balance > 0 ? "text-red-600" : "text-green-600"}>
                {formatCurrency(balance)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.lineItems.length > 0 ? (
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-500 font-medium">
                    Description
                  </th>
                  <th className="text-right py-2 text-gray-500 font-medium">Qty</th>
                  <th className="text-right py-2 text-gray-500 font-medium">
                    Unit Price
                  </th>
                  <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{Number(item.quantity)}</td>
                    <td className="py-2 text-right">
                      {formatCurrency(Number(item.unitPrice))}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(Number(item.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm mb-4">No line items yet.</p>
          )}
          <AddLineItemForm invoiceId={invoice.id} orgSlug={slug} />
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.payments.length > 0 ? (
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Method</th>
                  <th className="text-left py-2 text-gray-500 font-medium">
                    Reference
                  </th>
                  <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.payments.map((pmt) => (
                  <tr key={pmt.id}>
                    <td className="py-2">{formatDate(pmt.paidAt)}</td>
                    <td className="py-2">{pmt.method.replace("_", " ")}</td>
                    <td className="py-2 text-gray-500">{pmt.reference ?? "—"}</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(Number(pmt.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm mb-4">No payments recorded.</p>
          )}
          <RecordPaymentForm invoiceId={invoice.id} orgSlug={slug} />
        </CardContent>
      </Card>
    </div>
  )
}
