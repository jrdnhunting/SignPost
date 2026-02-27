"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateOrgName(
  id: string,
  name: string,
  slug: string
) {
  const org = await prisma.organization.update({
    where: { id },
    data: { name },
  })
  revalidatePath(`/${slug}/settings`)
  return org
}

export async function updateOrgSettings(
  id: string,
  data: {
    name?: string
    phone?: string
    contactEmail?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    outOfServiceAreaMessage?: string
    removalFormText?: string
    removalFormUrl?: string
  },
  slug: string
) {
  const org = await prisma.organization.update({
    where: { id },
    data,
  })
  revalidatePath(`/${slug}/settings`)
  return org
}
