export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import WorkOrderForm from "@/components/staff/work-order-form"

export default async function NewOrderPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const org = await prisma.organization.findUniqueOrThrow({ where: { slug } })
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

  const catalogItems = await prisma.inventoryItemType.findMany({
    where: { organizationId: org.id },
    select: { id: true, name: true, description: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Order</h1>
      <div className="bg-white rounded-lg border p-6">
        <WorkOrderForm
          orgSlug={slug}
          organizationId={org.id}
          clients={clients}
          serviceAreas={serviceAreas}
          catalogItems={catalogItems}
        />
      </div>
    </div>
  )
}
