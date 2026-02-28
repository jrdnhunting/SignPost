"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns the next task number for a work order (1-based). */
async function nextTaskNumber(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], workOrderId: string): Promise<number> {
  const last = await tx.task.findFirst({
    where: { workOrderId },
    orderBy: { taskNumber: "desc" },
    select: { taskNumber: true },
  })
  return (last?.taskNumber ?? 0) + 1
}

/**
 * Finds the org admin user for a work order to auto-assign owner tasks.
 * Returns the userId of the first ADMIN membership in the org, or null.
 */
export async function getOrgAdminUserId(organizationId: string): Promise<string | null> {
  const adminMembership = await prisma.membership.findFirst({
    where: { organizationId, role: "ADMIN" },
    select: { userId: true },
    orderBy: { createdAt: "asc" },
  })
  return adminMembership?.userId ?? null
}

// ── Auto-create initial task on order creation ─────────────────────────────

/**
 * Called within the createWorkOrder transaction.
 * Portal order (status=PENDING) → creates CONFIRM_ORDER task assigned to owner.
 * Admin order (status=CONFIRMED) → creates UTILITY_MARKING task assigned to owner.
 */
export async function createInitialTask(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  workOrderId: string,
  status: "PENDING" | "CONFIRMED",
  ownerId: string | null
) {
  const taskType = status === "PENDING" ? "CONFIRM_ORDER" : "UTILITY_MARKING"
  const taskNumber = await nextTaskNumber(tx, workOrderId)
  await tx.task.create({
    data: {
      workOrderId,
      taskType,
      taskNumber,
      assignedToId: ownerId,
    },
  })
}

// ── Manual task creation (staff only) ─────────────────────────────────────

const createTaskSchema = z.object({
  workOrderId: z.string(),
  taskType: z.enum(["CONFIRM_ORDER", "UTILITY_MARKING", "INSTALLATION", "REMOVAL", "REMOVAL_REQUEST", "SERVICE"]),
  assignedToId: z.string().optional().nullable(),
  notes: z.string().optional(),
  preferredDate: z.string().optional().nullable(),
  scheduledDate: z.string().optional().nullable(),
})

export async function createTask(data: z.infer<typeof createTaskSchema>, orgSlug: string) {
  const parsed = createTaskSchema.parse(data)

  const task = await prisma.$transaction(async (tx) => {
    const taskNumber = await nextTaskNumber(tx, parsed.workOrderId)
    return tx.task.create({
      data: {
        workOrderId: parsed.workOrderId,
        taskType: parsed.taskType,
        taskNumber,
        assignedToId: parsed.assignedToId ?? null,
        notes: parsed.notes,
        preferredDate: parsed.preferredDate ? new Date(parsed.preferredDate) : null,
        scheduledDate: parsed.scheduledDate ? new Date(parsed.scheduledDate) : null,
      },
    })
  })

  revalidatePath(`/${orgSlug}/orders`)
  revalidatePath(`/${orgSlug}/orders/${parsed.workOrderId}`)
  revalidatePath(`/${orgSlug}/tasks`)
  return task
}

// ── Update task status ─────────────────────────────────────────────────────

export async function updateTaskStatus(
  taskId: string,
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  opts: { scheduledDate?: string; orgSlug?: string } = {}
) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
      scheduledDate: opts.scheduledDate ? new Date(opts.scheduledDate) : undefined,
    },
    include: { workOrder: true },
  })

  // Drive work order status transitions on task completion
  if (status === "COMPLETED" && task.workOrderId) {
    await applyStatusTransition(task as { taskType: string; workOrderId: string }, opts.scheduledDate)
  }

  const wo = task.workOrder
  const slug = opts.orgSlug ?? "unknown"
  revalidatePath(`/${slug}/orders`)
  if (wo) {
    revalidatePath(`/${slug}/orders/${wo.id}`)
    revalidatePath(`/technician/assignments/${wo.id}`)
  }
  revalidatePath(`/${slug}/tasks`)
  revalidatePath(`/technician/assignments`)

  return task
}

/** Applies work order status transitions driven by task completion. */
async function applyStatusTransition(
  task: { taskType: string; workOrderId: string },
  scheduledDate?: string
) {
  const transitions: Record<string, { newStatus: string; extraData?: object }> = {
    CONFIRM_ORDER: {
      newStatus: "CONFIRMED",
      extraData: scheduledDate ? { scheduledDate: new Date(scheduledDate) } : {},
    },
    UTILITY_MARKING: { newStatus: "PENDING_INSTALLATION" },
    INSTALLATION: { newStatus: "INSTALLED" },
    REMOVAL: { newStatus: "COMPLETED", extraData: { completedAt: new Date() } },
  }

  const transition = transitions[task.taskType]
  if (!transition) return

  await prisma.workOrder.update({
    where: { id: task.workOrderId },
    data: { status: transition.newStatus as any, ...transition.extraData },
  })
}

// ── Removal request (from order page or anonymous form) ───────────────────

const removalRequestSchema = z.object({
  workOrderId: z.string(),
  requesterName: z.string().min(1),
  requesterPhone: z.string().optional(),
  requesterEmail: z.string().email().optional().or(z.literal("")),
  preferredDate: z.string().optional().nullable(),
  notes: z.string().optional(),
})

export async function createRemovalRequest(data: z.infer<typeof removalRequestSchema>) {
  const parsed = removalRequestSchema.parse(data)

  // Find the work order and its owner
  const wo = await prisma.workOrder.findUniqueOrThrow({
    where: { id: parsed.workOrderId },
    select: { ownerId: true },
  })

  const task = await prisma.$transaction(async (tx) => {
    const taskNumber = await nextTaskNumber(tx, parsed.workOrderId)
    return tx.task.create({
      data: {
        workOrderId: parsed.workOrderId,
        taskType: "REMOVAL_REQUEST",
        taskNumber,
        status: "PENDING",
        assignedToId: wo.ownerId,
        requesterName: parsed.requesterName,
        requesterPhone: parsed.requesterPhone || null,
        requesterEmail: parsed.requesterEmail || null,
        preferredDate: parsed.preferredDate ? new Date(parsed.preferredDate) : null,
        notes: parsed.notes || null,
      },
    })
  })

  // Email notification will be sent here when Resend is configured
  // await sendRemovalRequestEmail(task)

  return task
}

// ── Task panel data fetch ──────────────────────────────────────────────────

export async function getTaskPanelData(taskId: string) {
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: {
      assignedTo: true,
      workOrder: {
        include: {
          client: true,
          invoices: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
    },
  })
  return task
}

/** Derive a payment status label from a work order's invoices. */
export function derivePaymentStatus(invoices: { status: string }[]): string {
  if (!invoices.length) return "No Invoice"
  const statuses = invoices.map((i) => i.status)
  if (statuses.every((s) => s === "PAID")) return "Paid"
  if (statuses.some((s) => s === "OVERDUE")) return "Overdue"
  if (statuses.some((s) => s === "PARTIAL")) return "Partial"
  if (statuses.some((s) => s === "SENT")) return "Sent"
  return "Pending"
}

// ── Complete task with typed data ──────────────────────────────────────────

export async function completeTaskWithData(
  taskId: string,
  completionData: Record<string, unknown>,
  orgSlug: string
) {
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { workOrder: true },
  })

  // Per-type required field validation
  const missingFields = validateCompletionData(task.taskType as string, completionData)
  if (missingFields.length > 0) {
    throw new Error(`Required fields missing: ${missingFields.join(", ")}`)
  }

  // Build update payload
  const updateData: Record<string, unknown> = {
    status: "COMPLETED",
    completedAt: new Date(),
    completionData,
  }

  // UTILITY_MARKING: set scheduled install date on work order
  if (task.taskType === "UTILITY_MARKING" && completionData.scheduledInstallDate && task.workOrderId) {
    await prisma.workOrder.update({
      where: { id: task.workOrderId },
      data: { scheduledDate: new Date(completionData.scheduledInstallDate as string) },
    })
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: updateData as any,
    include: { workOrder: true },
  })

  // Drive status transitions
  if (updated.workOrder) {
    await applyStatusTransition(
      { taskType: task.taskType as string, workOrderId: task.workOrderId! },
      completionData.scheduledInstallDate as string | undefined
    )
  }

  const slug = orgSlug
  if (task.workOrderId) {
    revalidatePath(`/${slug}/orders/${task.workOrderId}`)
  }
  revalidatePath(`/${slug}/orders`)
  revalidatePath(`/${slug}/tasks`)
  revalidatePath(`/${slug}/dashboard`)

  return updated
}

function validateCompletionData(
  taskType: string,
  data: Record<string, unknown>
): string[] {
  const missing: string[] = []

  if (taskType === "UTILITY_MARKING") {
    if (!data.submissionDateTime) missing.push("Submission date/time")
    if (!data.referenceNumber) missing.push("Reference number")
    if (!data.scheduledInstallDate) missing.push("Scheduled install date")
  }

  if (taskType === "INSTALLATION") {
    if (!data.postType) missing.push("Post type")
    if (!data.installLocation) missing.push("Installation location")
    if (data.hasSignPanel === undefined || data.hasSignPanel === null) missing.push("Sign panel (yes/no)")
    if (data.hasRider === undefined || data.hasRider === null) missing.push("Rider (yes/no)")
    if (!data.gps) missing.push("GPS location")
    if (!data.sitePhotoUrl) missing.push("Site photo")
  }

  if (taskType === "REMOVAL") {
    if (!data.gps) missing.push("GPS location")
    if (!data.preRemovalPhotoUrl) missing.push("Pre-removal photo")
    if (!data.removalCondition) missing.push("Removal condition")
    if (data.collectedPanel === undefined || data.collectedPanel === null) missing.push("Sign panel collected (yes/no)")
    if (data.collectedPanel === true && !data.panelCondition) missing.push("Panel condition")
  }

  if (taskType === "SERVICE") {
    if (!data.workPerformed || !(data.workPerformed as string).trim()) missing.push("Work performed")
  }

  return missing
}

// ── Search orders for removal request matching ─────────────────────────────

export async function searchOrdersForRemoval(query: string, orgSlug: string) {
  const org = await prisma.organization.findUniqueOrThrow({ where: { slug: orgSlug } })

  const orders = await prisma.workOrder.findMany({
    where: {
      organizationId: org.id,
      status: { notIn: ["CANCELLED"] },
      OR: [
        { addressLine1: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
        { postalCode: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { client: true },
    orderBy: { orderId: "desc" },
    take: 10,
  })

  return orders
}

// ── Process removal request: link to order, schedule, create REMOVAL task ─

export async function processRemovalRequest(
  taskId: string,
  workOrderId: string,
  scheduledRemovalDateTime: string,
  orgSlug: string
) {
  const scheduledDate = new Date(scheduledRemovalDateTime)

  await prisma.$transaction(async (tx) => {
    const taskNumber = await (async () => {
      const last = await tx.task.findFirst({
        where: { workOrderId },
        orderBy: { taskNumber: "desc" },
        select: { taskNumber: true },
      })
      return (last?.taskNumber ?? 0) + 1
    })()

    // Link this task to the order and complete it
    await tx.task.update({
      where: { id: taskId },
      data: {
        workOrderId,
        status: "COMPLETED",
        completedAt: new Date(),
        scheduledDate,
        completionData: { scheduledRemovalDateTime, linkedOrderId: workOrderId },
      },
    })

    // Create the REMOVAL task
    await tx.task.create({
      data: {
        workOrderId,
        taskType: "REMOVAL",
        taskNumber,
        status: "PENDING",
      },
    })

    // Set scheduledRemovalDate and status on work order
    await tx.workOrder.update({
      where: { id: workOrderId },
      data: {
        scheduledRemovalDate: scheduledDate,
        status: "PENDING_REMOVAL",
      },
    })
  })

  revalidatePath(`/${orgSlug}/orders/${workOrderId}`)
  revalidatePath(`/${orgSlug}/orders`)
  revalidatePath(`/${orgSlug}/tasks`)
  revalidatePath(`/${orgSlug}/dashboard`)
}

// ── Anonymous removal form (no auth required) ──────────────────────────────

const anonymousRemovalSchema = z.object({
  organizationSlug: z.string(),
  agentName: z.string().min(1, "Agent name is required"),
  name: z.string().optional(),
  phone: z.string().optional(),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "ZIP is required"),
  preferredDate: z.string().optional().nullable(),
  notes: z.string().optional(),
})

export async function submitAnonymousRemovalRequest(data: z.infer<typeof anonymousRemovalSchema>) {
  const parsed = anonymousRemovalSchema.parse(data)

  const org = await prisma.organization.findUnique({
    where: { slug: parsed.organizationSlug },
    select: { id: true },
  })
  if (!org) throw new Error("Organization not found")

  // Find work order by address within this org
  const wo = await prisma.workOrder.findFirst({
    where: {
      organizationId: org.id,
      addressLine1: { equals: parsed.addressLine1, mode: "insensitive" },
      city: { equals: parsed.city, mode: "insensitive" },
      state: parsed.state,
      postalCode: parsed.postalCode,
      status: { in: ["INSTALLED", "PENDING_REMOVAL"] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, ownerId: true },
  })

  const submissionAddress = [
    parsed.addressLine1,
    parsed.addressLine2,
    `${parsed.city}, ${parsed.state} ${parsed.postalCode}`,
  ]
    .filter(Boolean)
    .join(", ")

  if (!wo) {
    // No exact match — create an unlinked task for staff to manually match
    const task = await prisma.task.create({
      data: {
        workOrderId: null,
        taskType: "REMOVAL_REQUEST",
        taskNumber: 1,
        status: "PENDING",
        requesterName: parsed.agentName,
        requesterPhone: parsed.phone || null,
        requesterEmail: null,
        notes: parsed.notes || null,
        preferredDate: parsed.preferredDate ? new Date(parsed.preferredDate) : null,
        submissionAddress,
      },
    })
    return { success: true, taskId: task.id }
  }

  const task = await prisma.$transaction(async (tx) => {
    const taskNumber = await nextTaskNumber(tx, wo.id)
    return tx.task.create({
      data: {
        workOrderId: wo.id,
        taskType: "REMOVAL_REQUEST",
        taskNumber,
        status: "PENDING",
        assignedToId: wo.ownerId,
        requesterName: parsed.agentName,
        requesterPhone: parsed.phone || null,
        requesterEmail: null,
        notes: parsed.notes || null,
        preferredDate: parsed.preferredDate ? new Date(parsed.preferredDate) : null,
        submissionAddress,
      },
    })
  })

  // Email notification will be sent here when Resend is configured
  // await sendRemovalRequestEmail(task)

  return { success: true, taskId: task.id }
}
