"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createInitialTask, getOrgAdminUserId } from "./tasks"
import { geocodeAddress } from "@/lib/geocode"

const workOrderSchema = z.object({
  organizationId: z.string(),
  clientId: z.string(),
  orderNotes: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().default("US"),
  locationNotes: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  scheduledDate: z.string().optional().nullable(),
  scheduledRemovalDate: z.string().optional().nullable(),
  listingGoLiveDate: z.string().optional().nullable(),
  internalNotes: z.string().optional(),
  createdById: z.string().optional(),
  serviceAreaId: z.string().optional().nullable(),
  serviceAreaFee: z.string().optional().nullable(),
})

type OrderItem = { description: string; quantity: number; unitPrice: number }

export async function createWorkOrder(
  data: z.infer<typeof workOrderSchema>,
  orgSlug: string,
  items: OrderItem[] = []
) {
  const parsed = workOrderSchema.parse(data)

  // Find the org admin to assign as order owner
  const ownerId = await getOrgAdminUserId(parsed.organizationId)

  const wo = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.update({
      where: { id: parsed.organizationId },
      data: { nextOrderSeq: { increment: 1 } },
      select: { nextOrderSeq: true },
    })
    const orderId = org.nextOrderSeq - 1

    const created = await tx.workOrder.create({
      data: {
        ...parsed,
        orderId,
        ownerId,
        scheduledDate: parsed.scheduledDate ? new Date(parsed.scheduledDate) : null,
        scheduledRemovalDate: parsed.scheduledRemovalDate ? new Date(parsed.scheduledRemovalDate) : null,
        listingGoLiveDate: parsed.listingGoLiveDate ? new Date(parsed.listingGoLiveDate) : null,
        // Admin-created orders skip PENDING → go directly to CONFIRMED
        status: "CONFIRMED",
      },
    })

    if (items.length > 0) {
      await tx.workOrderItem.createMany({
        data: items.map((item, i) => ({
          workOrderId: created.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sortOrder: i,
        })),
      })
    }

    // Auto-create initial task: Utility Marking (admin-created orders start at CONFIRMED)
    await createInitialTask(tx, created.id, "CONFIRMED", ownerId)

    return created
  })

  // Geocode address in background (non-blocking — don't await in the transaction)
  geocodeAddress(parsed).then((point) => {
    if (point) {
      prisma.workOrder.update({ where: { id: wo.id }, data: { lat: point.lat, lng: point.lng } }).catch(() => {})
    }
  })

  revalidatePath(`/${orgSlug}/orders`)
  return { ...wo, serviceAreaFee: wo.serviceAreaFee ? String(wo.serviceAreaFee) : null }
}

export async function updateWorkOrder(id: string, data: Partial<z.infer<typeof workOrderSchema>>, orgSlug: string) {
  const wo = await prisma.workOrder.update({
    where: { id },
    data: {
      ...data,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      scheduledRemovalDate: data.scheduledRemovalDate ? new Date(data.scheduledRemovalDate) : undefined,
      listingGoLiveDate: data.listingGoLiveDate ? new Date(data.listingGoLiveDate) : undefined,
    },
  })

  // Re-geocode if any address field changed
  if (data.addressLine1 || data.city || data.state || data.postalCode) {
    geocodeAddress({
      addressLine1: wo.addressLine1,
      addressLine2: wo.addressLine2,
      city: wo.city,
      state: wo.state,
      postalCode: wo.postalCode,
      country: wo.country,
    }).then((point) => {
      if (point) {
        prisma.workOrder.update({ where: { id }, data: { lat: point.lat, lng: point.lng } }).catch(() => {})
      }
    })
  }

  revalidatePath(`/${orgSlug}/orders`)
  revalidatePath(`/${orgSlug}/orders/${id}`)
  return { ...wo, serviceAreaFee: wo.serviceAreaFee ? String(wo.serviceAreaFee) : null }
}

export async function updateWorkOrderStatus(id: string, status: string, orgSlug: string) {
  const wo = await prisma.workOrder.update({
    where: { id },
    data: {
      status: status as any,
      completedAt: status === "COMPLETED" ? new Date() : undefined,
      cancelledAt: status === "CANCELLED" ? new Date() : undefined,
      installedAt: status === "INSTALLED" ? new Date() : undefined,
    },
  })
  revalidatePath(`/${orgSlug}/orders/${id}`)
  return { ...wo, serviceAreaFee: wo.serviceAreaFee ? String(wo.serviceAreaFee) : null }
}

export async function addWorkOrderItem(workOrderId: string, data: { description: string; quantity: number; unitPrice: number; notes?: string }, orgSlug: string) {
  const item = await prisma.workOrderItem.create({
    data: {
      workOrderId,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      notes: data.notes,
    },
  })
  revalidatePath(`/${orgSlug}/orders/${workOrderId}`)
  return { ...item, unitPrice: String(item.unitPrice) }
}

export async function deleteWorkOrderItem(id: string, workOrderId: string, orgSlug: string) {
  await prisma.workOrderItem.delete({ where: { id } })
  revalidatePath(`/${orgSlug}/orders/${workOrderId}`)
}

export async function archiveWorkOrder(id: string, orgSlug: string) {
  await prisma.workOrder.update({ where: { id }, data: { archivedAt: new Date() } })
  revalidatePath(`/${orgSlug}/orders`)
  revalidatePath(`/${orgSlug}/orders/${id}`)
}

export async function unarchiveWorkOrder(id: string, orgSlug: string) {
  await prisma.workOrder.update({ where: { id }, data: { archivedAt: null } })
  revalidatePath(`/${orgSlug}/orders`)
  revalidatePath(`/${orgSlug}/orders/${id}`)
}

// Portal: client submits a new work order
export async function submitPortalOrder(data: {
  clientId: string
  submittedById: string
  orderNotes?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country?: string
  locationNotes?: string
  serviceAreaId?: string | null
  serviceAreaFee?: number | null
}) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: data.clientId },
    select: { organizationId: true },
  })

  // Find the org admin to assign as order owner
  const ownerId = await getOrgAdminUserId(client.organizationId)

  const wo = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.update({
      where: { id: client.organizationId },
      data: { nextOrderSeq: { increment: 1 } },
      select: { nextOrderSeq: true },
    })
    const orderId = org.nextOrderSeq - 1

    const created = await tx.workOrder.create({
      data: {
        organizationId: client.organizationId,
        clientId: data.clientId,
        submittedById: data.submittedById,
        orderId,
        ownerId,
        orderNotes: data.orderNotes,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country ?? "US",
        locationNotes: data.locationNotes,
        // Portal-submitted orders start as PENDING — awaiting admin confirmation
        status: "PENDING",
        serviceAreaId: data.serviceAreaId ?? null,
        serviceAreaFee: data.serviceAreaFee ?? null,
      },
    })

    // Auto-create CONFIRM_ORDER task assigned to admin
    await createInitialTask(tx, created.id, "PENDING", ownerId)

    return created
  })

  // Geocode address in background
  geocodeAddress({
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    country: data.country,
  }).then((point) => {
    if (point) {
      prisma.workOrder.update({ where: { id: wo.id }, data: { lat: point.lat, lng: point.lng } }).catch(() => {})
    }
  })

  revalidatePath(`/portal/${data.clientId}/orders`)
  return { ...wo, serviceAreaFee: wo.serviceAreaFee ? String(wo.serviceAreaFee) : null }
}
