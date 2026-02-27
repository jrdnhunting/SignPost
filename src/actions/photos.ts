"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function savePhoto(data: {
  workOrderId: string
  uploadedById: string
  url: string
  caption?: string
  context: string
  takenAt?: string
}, orgSlug?: string) {
  const photo = await prisma.photo.create({
    data: {
      workOrderId: data.workOrderId,
      uploadedById: data.uploadedById,
      url: data.url,
      caption: data.caption,
      context: data.context as any,
      takenAt: data.takenAt ? new Date(data.takenAt) : undefined,
    },
  })
  if (orgSlug) {
    revalidatePath(`/${orgSlug}/orders/${data.workOrderId}`)
  }
  revalidatePath(`/technician/assignments/${data.workOrderId}`)
  return photo
}
