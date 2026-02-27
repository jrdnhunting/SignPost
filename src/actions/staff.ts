"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function inviteStaffMember(
  orgId: string,
  data: {
    email: string
    name: string
    password: string
    isStaff: boolean
    isTechnician: boolean
  },
  orgSlug: string
) {
  const passwordHash = await bcrypt.hash(data.password, 12)

  const user = await prisma.user.upsert({
    where: { email: data.email },
    create: {
      email: data.email,
      name: data.name,
      passwordHash,
    },
    update: {},
  })

  const roles: ("DISPATCHER" | "TECHNICIAN")[] = []
  if (data.isStaff) roles.push("DISPATCHER")
  if (data.isTechnician) roles.push("TECHNICIAN")

  for (const role of roles) {
    await prisma.membership.upsert({
      where: {
        organizationId_userId_role: {
          organizationId: orgId,
          userId: user.id,
          role,
        },
      },
      create: { organizationId: orgId, userId: user.id, role },
      update: {},
    })
  }

  revalidatePath(`/${orgSlug}/settings`)
  return user
}

export async function updateStaffRoles(
  orgId: string,
  userId: string,
  isStaff: boolean,
  isTechnician: boolean,
  orgSlug: string
) {
  // Add or remove DISPATCHER
  if (isStaff) {
    await prisma.membership.upsert({
      where: {
        organizationId_userId_role: {
          organizationId: orgId,
          userId,
          role: "DISPATCHER",
        },
      },
      create: { organizationId: orgId, userId, role: "DISPATCHER" },
      update: {},
    })
  } else {
    await prisma.membership
      .delete({
        where: {
          organizationId_userId_role: {
            organizationId: orgId,
            userId,
            role: "DISPATCHER",
          },
        },
      })
      .catch(() => {
        // ignore if doesn't exist
      })
  }

  // Add or remove TECHNICIAN
  if (isTechnician) {
    await prisma.membership.upsert({
      where: {
        organizationId_userId_role: {
          organizationId: orgId,
          userId,
          role: "TECHNICIAN",
        },
      },
      create: { organizationId: orgId, userId, role: "TECHNICIAN" },
      update: {},
    })
  } else {
    await prisma.membership
      .delete({
        where: {
          organizationId_userId_role: {
            organizationId: orgId,
            userId,
            role: "TECHNICIAN",
          },
        },
      })
      .catch(() => {
        // ignore if doesn't exist
      })
  }

  revalidatePath(`/${orgSlug}/settings`)
}

export async function removeStaffMember(
  orgId: string,
  userId: string,
  orgSlug: string
) {
  await prisma.membership.deleteMany({
    where: {
      organizationId: orgId,
      userId,
      role: { not: "ADMIN" },
    },
  })
  revalidatePath(`/${orgSlug}/settings`)
}
