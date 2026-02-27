"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function clockIn(workOrderId: string, userId: string) {
  // Ensure no open log for this user+workOrder
  const existing = await prisma.workLog.findFirst({
    where: { workOrderId, userId, endedAt: null },
  })
  if (existing) return existing

  const log = await prisma.workLog.create({
    data: { workOrderId, userId, startedAt: new Date() },
  })
  // Move WO to PENDING_INSTALLATION if it's still at CONFIRMED
  await prisma.workOrder.updateMany({
    where: { id: workOrderId, status: "CONFIRMED" },
    data: { status: "PENDING_INSTALLATION" },
  })
  revalidatePath(`/technician/assignments/${workOrderId}`)
  return log
}

export async function clockOut(logId: string, workOrderId: string) {
  const log = await prisma.workLog.update({
    where: { id: logId },
    data: { endedAt: new Date() },
  })
  revalidatePath(`/technician/assignments/${workOrderId}`)
  return log
}
