"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createItemType(data: {
  organizationId: string
  name: string
  sku?: string
  description?: string
  unit?: string
  reorderPoint?: number
}, orgSlug: string) {
  const item = await prisma.inventoryItemType.create({ data })
  revalidatePath(`/${orgSlug}/inventory`)
  return item
}

export async function recordTransaction(data: {
  inventoryItemTypeId: string
  workOrderId?: string
  type: string
  quantity: number
  notes?: string
}, orgSlug: string) {
  const tx = await prisma.inventoryTransaction.create({
    data: {
      inventoryItemTypeId: data.inventoryItemTypeId,
      workOrderId: data.workOrderId,
      type: data.type as any,
      quantity: data.quantity,
      notes: data.notes,
    },
  })
  // Update denormalized currentStock
  await prisma.inventoryItemType.update({
    where: { id: data.inventoryItemTypeId },
    data: { currentStock: { increment: data.quantity } },
  })
  revalidatePath(`/${orgSlug}/inventory`)
  return tx
}
