"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function assignTechnician(workOrderId: string, userId: string, notes: string | undefined, orgSlug: string) {
  const assignment = await prisma.assignment.create({
    data: { workOrderId, userId, notes, status: "PENDING" },
  })
  revalidatePath(`/${orgSlug}/orders/${workOrderId}`)
  return assignment
}

export async function updateAssignmentStatus(id: string, status: string, workOrderId: string, orgSlug: string) {
  const assignment = await prisma.assignment.update({
    where: { id },
    data: { status: status as any },
  })
  revalidatePath(`/${orgSlug}/orders/${workOrderId}`)
  revalidatePath(`/technician/assignments/${workOrderId}`)
  return assignment
}

export async function removeAssignment(id: string, workOrderId: string, orgSlug: string) {
  await prisma.assignment.delete({ where: { id } })
  revalidatePath(`/${orgSlug}/orders/${workOrderId}`)
}
