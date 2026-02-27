"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function createClient(data: {
  organizationId: string
  firstName: string
  lastName: string
  companyName?: string
  email: string
  phone: string
  notes?: string
  clientNotesPublic?: string
  clientNotesPrivate?: string
}, orgSlug: string) {
  const client = await prisma.client.create({ data })
  revalidatePath(`/${orgSlug}/clients`)
  return client
}

export async function updateClient(id: string, data: {
  firstName?: string
  lastName?: string
  companyName?: string | null
  email?: string
  phone?: string
  profilePhotoUrl?: string | null
  notes?: string
  clientNotesPublic?: string | null
  clientNotesPrivate?: string | null
}, orgSlug: string) {
  const client = await prisma.client.update({ where: { id }, data })
  revalidatePath(`/${orgSlug}/clients`)
  revalidatePath(`/${orgSlug}/clients/${id}`)
  return client
}

export async function createClientUser(data: {
  clientId: string
  email: string
  name: string
  password: string
  phone?: string
}, orgSlug: string) {
  const passwordHash = await bcrypt.hash(data.password, 12)
  const user = await prisma.clientUser.create({
    data: {
      clientId: data.clientId,
      email: data.email,
      name: data.name,
      passwordHash,
      phone: data.phone,
    },
  })
  revalidatePath(`/${orgSlug}/clients/${data.clientId}`)
  return user
}

// ── Payment methods ──────────────────────────────────────────────────────────

export async function createPaymentMethod(data: {
  clientId: string
  type: string
  label: string
  isDefault?: boolean
  notes?: string
}, orgSlug: string) {
  // If this is the default, unset any existing default first
  if (data.isDefault) {
    await prisma.clientPaymentMethod.updateMany({
      where: { clientId: data.clientId },
      data: { isDefault: false },
    })
  }
  const pm = await prisma.clientPaymentMethod.create({ data })
  revalidatePath(`/${orgSlug}/clients/${data.clientId}`)
  return pm
}

export async function updatePaymentMethod(id: string, data: {
  type?: string
  label?: string
  isDefault?: boolean
  notes?: string
}, clientId: string, orgSlug: string) {
  if (data.isDefault) {
    await prisma.clientPaymentMethod.updateMany({
      where: { clientId },
      data: { isDefault: false },
    })
  }
  const pm = await prisma.clientPaymentMethod.update({ where: { id }, data })
  revalidatePath(`/${orgSlug}/clients/${clientId}`)
  return pm
}

export async function deletePaymentMethod(id: string, clientId: string, orgSlug: string) {
  await prisma.clientPaymentMethod.delete({ where: { id } })
  revalidatePath(`/${orgSlug}/clients/${clientId}`)
}
