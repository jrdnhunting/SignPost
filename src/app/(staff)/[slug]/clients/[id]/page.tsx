export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkOrderStatusBadge } from "@/components/staff/work-order-status-badge"
import { formatDate, formatAddress } from "@/lib/utils"
import { AddClientUserForm } from "./add-client-user-form"
import { ClientEditForm } from "./client-edit-form"
import { ClientPhotoUpload } from "./client-photo-upload"
import { PaymentMethodsCard } from "./payment-methods-card"

// Thin wrapper that holds edit toggle state (needs to be a client component)
import { ClientDetailShell } from "./client-detail-shell"

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const org = await prisma.organization.findUniqueOrThrow({ where: { slug } })

  const client = await prisma.client.findUnique({
    where: { id, organizationId: org.id },
    include: {
      clientUsers: true,
      paymentMethods: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
      workOrders: { where: { archivedAt: null }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  })
  if (!client) notFound()

  const displayName = `${client.firstName} ${client.lastName}`

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href={`/${slug}/clients`} className="hover:text-blue-600">Clients</Link>
        <span>/</span>
        <span>{displayName}</span>
      </div>

      <ClientDetailShell
        client={client}
        orgSlug={slug}
        displayName={displayName}
        workOrders={client.workOrders}
      />
    </div>
  )
}
