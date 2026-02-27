"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createServiceArea(
  orgId: string,
  data: {
    name: string
    polygon: object
    pricingAdjustment?: number | null
  },
  orgSlug: string
) {
  const area = await prisma.serviceArea.create({
    data: {
      organizationId: orgId,
      name: data.name,
      polygon: data.polygon,
      pricingAdjustment: data.pricingAdjustment ?? null,
    },
  })
  revalidatePath(`/${orgSlug}/settings`)
  // Serialize Decimal → string so Next.js can pass to Client Components
  return {
    id: area.id,
    name: area.name,
    polygon: area.polygon,
    pricingAdjustment: area.pricingAdjustment ? area.pricingAdjustment.toString() : null,
  }
}

export async function updateServiceArea(
  id: string,
  data: {
    name?: string
    polygon?: object
    pricingAdjustment?: number | null
  },
  orgSlug: string
) {
  const area = await prisma.serviceArea.update({
    where: { id },
    data,
  })
  revalidatePath(`/${orgSlug}/settings`)
  return {
    id: area.id,
    name: area.name,
    polygon: area.polygon,
    pricingAdjustment: area.pricingAdjustment ? area.pricingAdjustment.toString() : null,
  }
}

export async function deleteServiceArea(id: string, orgSlug: string) {
  await prisma.serviceArea.delete({ where: { id } })
  revalidatePath(`/${orgSlug}/settings`)
}

export async function setServiceAreaTechnicians(
  serviceAreaId: string,
  userIds: string[],
  orgSlug: string
) {
  await prisma.$transaction([
    prisma.serviceAreaTechnician.deleteMany({ where: { serviceAreaId } }),
    ...userIds.map((userId) =>
      prisma.serviceAreaTechnician.create({ data: { serviceAreaId, userId } })
    ),
  ])
  revalidatePath(`/${orgSlug}/settings`)
}
