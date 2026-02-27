export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OrderForm from "@/components/portal/order-form"

export default async function NewPortalOrderPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const session = await auth()
  const submittedById = session?.user?.userId ?? ""

  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    select: { organizationId: true },
  })

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: client.organizationId },
    select: { outOfServiceAreaMessage: true },
  })

  const rawAreas = await prisma.serviceArea.findMany({
    where: { organizationId: client.organizationId },
    select: { id: true, name: true, polygon: true, pricingAdjustment: true },
  })
  const serviceAreas = rawAreas.map((a) => ({
    id: a.id,
    name: a.name,
    polygon: a.polygon as object,
    pricingAdjustment: a.pricingAdjustment ? String(a.pricingAdjustment) : null,
  }))

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Submit New Order</h1>
      <div className="bg-white rounded-lg border p-6">
        <OrderForm
          clientId={clientId}
          submittedById={submittedById}
          serviceAreas={serviceAreas}
          outOfServiceAreaMessage={org.outOfServiceAreaMessage}
        />
      </div>
    </div>
  )
}
