"use server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ── Staff user (User model) ────────────────────────────────────────────────

const updateProfileSchema = z.object({
  userId: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
})

export async function updateStaffProfile(data: z.infer<typeof updateProfileSchema>, orgSlug: string) {
  const parsed = updateProfileSchema.parse(data)

  // Check email isn't taken by another user
  const conflict = await prisma.user.findFirst({
    where: { email: parsed.email, NOT: { id: parsed.userId } },
  })
  if (conflict) throw new Error("That email is already in use")

  await prisma.user.update({
    where: { id: parsed.userId },
    data: { name: parsed.name, email: parsed.email },
  })

  revalidatePath(`/${orgSlug}/profile`)
}

const changePasswordSchema = z.object({
  userId: z.string(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

export async function changeStaffPassword(data: z.infer<typeof changePasswordSchema>) {
  const parsed = changePasswordSchema.parse(data)

  const user = await prisma.user.findUniqueOrThrow({ where: { id: parsed.userId } })

  const valid = await bcrypt.compare(parsed.currentPassword, user.passwordHash)
  if (!valid) throw new Error("Current password is incorrect")

  const hash = await bcrypt.hash(parsed.newPassword, 12)
  await prisma.user.update({ where: { id: parsed.userId }, data: { passwordHash: hash } })
}

// ── Client portal user (ClientUser model) ─────────────────────────────────

export async function updateClientUserProfile(
  data: z.infer<typeof updateProfileSchema>,
  clientId: string
) {
  const parsed = updateProfileSchema.parse(data)

  const conflict = await prisma.clientUser.findFirst({
    where: { email: parsed.email, NOT: { id: parsed.userId } },
  })
  if (conflict) throw new Error("That email is already in use")

  await prisma.clientUser.update({
    where: { id: parsed.userId },
    data: { name: parsed.name, email: parsed.email },
  })

  revalidatePath(`/portal/${clientId}/profile`)
}

const changeClientPasswordSchema = z.object({
  userId: z.string(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

export async function changeClientUserPassword(data: z.infer<typeof changeClientPasswordSchema>) {
  const parsed = changeClientPasswordSchema.parse(data)

  const user = await prisma.clientUser.findUniqueOrThrow({ where: { id: parsed.userId } })

  const valid = await bcrypt.compare(parsed.currentPassword, user.passwordHash)
  if (!valid) throw new Error("Current password is incorrect")

  const hash = await bcrypt.hash(parsed.newPassword, 12)
  await prisma.clientUser.update({ where: { id: parsed.userId }, data: { passwordHash: hash } })
}

// ── Portal payment methods (ClientPaymentMethod — portal revalidation) ────

export async function portalCreatePaymentMethod(
  data: { clientId: string; type: string; label: string; isDefault?: boolean; notes?: string }
) {
  if (data.isDefault) {
    await prisma.clientPaymentMethod.updateMany({
      where: { clientId: data.clientId },
      data: { isDefault: false },
    })
  }
  const pm = await prisma.clientPaymentMethod.create({ data })
  revalidatePath(`/portal/${data.clientId}/profile`)
  return pm
}

export async function portalUpdatePaymentMethod(
  id: string,
  data: { type?: string; label?: string; isDefault?: boolean; notes?: string },
  clientId: string
) {
  if (data.isDefault) {
    await prisma.clientPaymentMethod.updateMany({
      where: { clientId },
      data: { isDefault: false },
    })
  }
  const pm = await prisma.clientPaymentMethod.update({ where: { id }, data })
  revalidatePath(`/portal/${clientId}/profile`)
  return pm
}

export async function portalDeletePaymentMethod(id: string, clientId: string) {
  await prisma.clientPaymentMethod.delete({ where: { id } })
  revalidatePath(`/portal/${clientId}/profile`)
}

// ── Client account (Client model — company info) ───────────────────────────

const updateClientAccountSchema = z.object({
  clientId: z.string(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  notificationEmails: z.array(z.string().email("Invalid email address")),
})

export async function updateClientAccount(data: z.infer<typeof updateClientAccountSchema>) {
  const parsed = updateClientAccountSchema.parse(data)

  await prisma.client.update({
    where: { id: parsed.clientId },
    data: {
      companyName: parsed.companyName?.trim() || null,
      phone: parsed.phone?.trim() || "",
      notificationEmails: parsed.notificationEmails,
    },
  })

  revalidatePath(`/portal/${parsed.clientId}/profile`)
}
