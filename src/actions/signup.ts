"use server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createInitialTask } from "./tasks"

interface SignUpData {
  companyName: string
  slug: string
  adminName: string
  email: string
  password: string
  phone?: string
}

export async function signUp(data: SignUpData): Promise<{ success: true; orgSlug: string } | { success: false; error: string }> {
  const { companyName, slug, adminName, email, password, phone } = data

  // Basic validation
  if (!companyName || companyName.length < 2) return { success: false, error: "Company name must be at least 2 characters" }
  if (!slug || slug.length < 2 || slug.length > 50 || !/^[a-z0-9-]+$/.test(slug)) return { success: false, error: "Invalid company URL" }
  if (!adminName || adminName.length < 2) return { success: false, error: "Name must be at least 2 characters" }
  if (!email) return { success: false, error: "Email is required" }
  if (!password || password.length < 8) return { success: false, error: "Password must be at least 8 characters" }

  try {
    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction(async (tx) => {
      // 1. Create org
      const org = await tx.organization.create({
        data: { name: companyName, slug, plan: "starter", nextOrderSeq: 0 },
      })

      // 2. Create admin user
      const user = await tx.user.create({
        data: { email, name: adminName, passwordHash, phone },
      })

      // 3. Membership
      await tx.membership.create({
        data: { organizationId: org.id, userId: user.id, role: "ADMIN" },
      })

      // 4. Sample client
      const client = await tx.client.create({
        data: {
          firstName: "Sarah",
          lastName: "Johnson",
          companyName: "Johnson Realty Group",
          email: "sarah.johnson@example.com",
          phone: "(555) 234-5678",
          organizationId: org.id,
        },
      })

      // 5. Increment order seq
      const updatedOrg = await tx.organization.update({
        where: { id: org.id },
        data: { nextOrderSeq: { increment: 1 } },
        select: { nextOrderSeq: true },
      })
      const orderId = updatedOrg.nextOrderSeq - 1

      // 6. Sample work order
      const workOrder = await tx.workOrder.create({
        data: {
          organizationId: org.id,
          clientId: client.id,
          createdById: user.id,
          ownerId: user.id,
          orderId,
          status: "PENDING",
          addressLine1: "742 Evergreen Terrace",
          city: "Springfield",
          state: "IL",
          postalCode: "62701",
          country: "US",
          orderNotes: "New listing — please install ASAP",
        },
      })

      // 7. Two sample line items
      await tx.workOrderItem.create({
        data: {
          workOrderId: workOrder.id,
          description: "Install 4×8 Corrugated Sign Panel",
          quantity: 1,
          unitPrice: 85,
          sortOrder: 0,
        },
      })
      await tx.workOrderItem.create({
        data: {
          workOrderId: workOrder.id,
          description: "Install Sign Rider (double-sided)",
          quantity: 2,
          unitPrice: 25,
          sortOrder: 1,
        },
      })

      // 8. Initial task
      await createInitialTask(tx, workOrder.id, "PENDING", user.id)
    })

    return { success: true, orgSlug: slug }
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      const target = (err as { meta?: { target?: string[] } }).meta?.target ?? []
      if (target.includes("slug")) return { success: false, error: "That company URL is already taken" }
      if (target.includes("email")) return { success: false, error: "An account with that email already exists" }
    }
    console.error("signUp error:", err)
    return { success: false, error: "Something went wrong, please try again" }
  }
}
