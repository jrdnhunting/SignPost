"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function setUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return { success: false, error: "Unauthorized" }
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" }
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) {
    return { success: false, error: "User not found" }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })

  return { success: true }
}

// ── Org billing management ─────────────────────────────────────────────────

interface BillingInput {
  plan: string
  subscriptionStatus: string
  billingCycle: string
  monthlyRate: string | null
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
  billingEmail: string | null
  billingNotes: string | null
}

export async function updateOrgBilling(
  orgId: string,
  data: BillingInput
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return { success: false, error: "Unauthorized" }
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } })
  if (!org) {
    return { success: false, error: "Organization not found" }
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      plan: data.plan,
      subscriptionStatus: data.subscriptionStatus,
      billingCycle: data.billingCycle,
      monthlyRate: data.monthlyRate ? parseFloat(data.monthlyRate) : null,
      trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
      currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
      stripeCustomerId: data.stripeCustomerId || null,
      billingEmail: data.billingEmail || null,
      billingNotes: data.billingNotes || null,
    },
  })

  revalidatePath(`/superadmin/${orgId}`)
  revalidatePath("/superadmin")
  return { success: true }
}
