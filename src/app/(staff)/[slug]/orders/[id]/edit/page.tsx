export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import WorkOrderForm from "@/components/staff/work-order-form"
import Link from "next/link"
import { formatOrderId } from "@/lib/utils"

export default async function EditWorkOrderPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const org = await prisma.organization.findUniqueOrThrow({ where: { slug } })

  const wo = await prisma.workOrder.findUnique({
    where: { id, organizationId: org.id },
  })
  if (!wo) notFound()

  const rawClients = await prisma.client.findMany({
    where: { organizationId: org.id },
    select: { id: true, firstName: true, lastName: true, companyName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })
  const clients = rawClients.map((c) => ({
    id: c.id,
    companyName: `${c.firstName} ${c.lastName}${c.companyName ? ` (${c.companyName})` : ""}`,
  }))

  const rawAreas = await prisma.serviceArea.findMany({
    where: { organizationId: org.id },
    select: { id: true, name: true, polygon: true, pricingAdjustment: true },
  })
  const serviceAreas = rawAreas.map((a) => ({
    id: a.id,
    name: a.name,
    polygon: a.polygon as object,
    pricingAdjustment: a.pricingAdjustment ? String(a.pricingAdjustment) : null,
  }))

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href={`/${slug}/orders`} className="hover:text-blue-600">
          Orders
        </Link>
        <span>/</span>
        <Link href={`/${slug}/orders/${id}`} className="hover:text-blue-600">
          #{formatOrderId(wo.orderId)}
        </Link>
        <span>/</span>
        <span>Edit</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Order</h1>
      <div className="bg-white rounded-lg border p-6">
        <WorkOrderForm
          orgSlug={slug}
          organizationId={org.id}
          clients={clients}
          workOrderId={id}
          serviceAreas={serviceAreas}
          defaultValues={{
            organizationId: org.id,
            clientId: wo.clientId,
            orderNotes: wo.orderNotes ?? undefined,
            addressLine1: wo.addressLine1,
            addressLine2: wo.addressLine2 ?? undefined,
            city: wo.city,
            state: wo.state,
            postalCode: wo.postalCode,
            country: wo.country,
            locationNotes: wo.locationNotes ?? undefined,
            priority: wo.priority,
            listingGoLiveDate: wo.listingGoLiveDate
              ? wo.listingGoLiveDate.toISOString().split("T")[0]
              : undefined,
            scheduledDate: wo.scheduledDate
              ? wo.scheduledDate.toISOString().split("T")[0]
              : undefined,
            scheduledRemovalDate: wo.scheduledRemovalDate
              ? wo.scheduledRemovalDate.toISOString().split("T")[0]
              : undefined,
            internalNotes: wo.internalNotes ?? undefined,
            serviceAreaId: wo.serviceAreaId ?? null,
            serviceAreaFee: wo.serviceAreaFee ? String(wo.serviceAreaFee) : null,
          }}
        />
      </div>
    </div>
  )
}
