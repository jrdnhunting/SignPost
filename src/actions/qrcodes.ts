"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function generateUniqueCode(): Promise<string> {
  for (let attempts = 0; attempts < 10; attempts++) {
    const code = Math.random().toString(36).slice(2, 8)
    const existing = await prisma.qRCode.findUnique({ where: { code } })
    if (!existing) return code
  }
  throw new Error("Failed to generate unique QR code")
}

export async function createQRCode(
  data: {
    organizationId: string
    name: string
    targetUrl: string
    clientId?: string | null
  },
  slug: string
) {
  const code = await generateUniqueCode()
  const qr = await prisma.qRCode.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      code,
      targetUrl: data.targetUrl,
      clientId: data.clientId ?? null,
    },
  })
  revalidatePath(`/${slug}/qrcodes`)
  return qr
}

export async function updateQRCode(
  id: string,
  data: { name?: string; targetUrl?: string; clientId?: string | null },
  slug: string
) {
  const qr = await prisma.qRCode.update({ where: { id }, data })
  revalidatePath(`/${slug}/qrcodes`)
  return qr
}

export async function deleteQRCode(id: string, slug: string) {
  await prisma.qRCode.delete({ where: { id } })
  revalidatePath(`/${slug}/qrcodes`)
}
