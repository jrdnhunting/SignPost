"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createCatalogItem(
  data: {
    organizationId: string
    name: string
    description?: string
    price?: string
    serviceType: "MAIN_SERVICE" | "ADD_ON" | "PRODUCT" | "FEE"
    isActive?: boolean
    sortOrder?: number
  },
  slug: string
) {
  const item = await prisma.catalogItem.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      description: data.description || null,
      price: data.price ? parseFloat(data.price) : null,
      serviceType: data.serviceType,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  })
  revalidatePath(`/${slug}/settings`)
  return item
}

export async function updateCatalogItem(
  id: string,
  data: {
    name?: string
    description?: string
    price?: string | null
    serviceType?: "MAIN_SERVICE" | "ADD_ON" | "PRODUCT" | "FEE"
    isActive?: boolean
    sortOrder?: number
  },
  slug: string
) {
  const item = await prisma.catalogItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.price !== undefined && { price: data.price ? parseFloat(data.price) : null }),
      ...(data.serviceType !== undefined && { serviceType: data.serviceType }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  })
  revalidatePath(`/${slug}/settings`)
  return item
}

export async function deleteCatalogItem(id: string, slug: string) {
  await prisma.catalogItem.delete({ where: { id } })
  revalidatePath(`/${slug}/settings`)
}
