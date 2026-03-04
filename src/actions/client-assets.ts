"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { AssetCategory } from "@prisma/client"

export async function createClientAsset(
  data: {
    organizationId: string
    clientId: string
    category: AssetCategory
    name: string
    description?: string
    quantity?: number
    locationWorkOrderId?: string
    locationUserId?: string
    locationLabel?: string
    notes?: string
  },
  orgSlug: string
) {
  const asset = await prisma.clientAsset.create({ data })
  revalidatePath(`/${orgSlug}/inventory`)
  return asset
}

export async function updateClientAsset(
  id: string,
  data: {
    name?: string
    description?: string
    quantity?: number
    notes?: string
  },
  orgSlug: string
) {
  const asset = await prisma.clientAsset.update({ where: { id }, data })
  revalidatePath(`/${orgSlug}/inventory`)
  return asset
}

export async function moveClientAsset(
  id: string,
  location: {
    locationWorkOrderId?: string | null
    locationUserId?: string | null
    locationLabel?: string | null
  },
  orgSlug: string
) {
  const asset = await prisma.clientAsset.update({
    where: { id },
    data: {
      locationWorkOrderId: location.locationWorkOrderId ?? null,
      locationUserId: location.locationUserId ?? null,
      locationLabel: location.locationLabel ?? null,
    },
  })
  revalidatePath(`/${orgSlug}/inventory`)
  return asset
}

export async function deleteClientAsset(id: string, orgSlug: string) {
  await prisma.clientAsset.delete({ where: { id } })
  revalidatePath(`/${orgSlug}/inventory`)
}
