"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createEmailTemplate(
  data: {
    organizationId: string
    name: string
    subject: string
    body: string
    triggerDays: number
    isActive?: boolean
  },
  slug: string
) {
  const template = await prisma.emailTemplate.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      subject: data.subject,
      body: data.body,
      triggerDays: data.triggerDays,
      isActive: data.isActive ?? true,
    },
  })
  revalidatePath(`/${slug}/settings`)
  return template
}

export async function updateEmailTemplate(
  id: string,
  data: {
    name?: string
    subject?: string
    body?: string
    triggerDays?: number
    isActive?: boolean
  },
  slug: string
) {
  const template = await prisma.emailTemplate.update({
    where: { id },
    data,
  })
  revalidatePath(`/${slug}/settings`)
  return template
}

export async function deleteEmailTemplate(id: string, slug: string) {
  await prisma.emailTemplate.delete({ where: { id } })
  revalidatePath(`/${slug}/settings`)
}
