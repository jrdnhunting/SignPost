export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TaskStatusFilter } from "./task-status-filter"
import { CreateTaskDialog } from "./create-task-dialog"
import { TasksClient } from "./tasks-client"
import { Suspense } from "react"

export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ status?: string; mine?: string }>
}) {
  const { slug } = await params
  const { status, mine } = await searchParams
  const session = await auth()

  const org = await prisma.organization.findUniqueOrThrow({ where: { slug } })

  const showMineOnly = mine === "1"

  // For "New Task" dialog: active orders + staff members
  const [activeOrders, staffMemberships] = await Promise.all([
    prisma.workOrder.findMany({
      where: {
        organizationId: org.id,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      include: { client: true },
      orderBy: { orderId: "desc" },
      take: 100,
    }),
    prisma.membership.findMany({
      where: { organizationId: org.id, role: { in: ["ADMIN", "DISPATCHER", "TECHNICIAN"] } },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const tasks = await prisma.task.findMany({
    where: {
      workOrder: { organizationId: org.id },
      ...(status ? { status: status as any } : { status: { in: ["PENDING", "IN_PROGRESS"] } }),
      ...(showMineOnly && session?.user ? { assignedToId: session.user.userId } : {}),
    },
    include: {
      workOrder: { include: { client: true } },
      assignedTo: true,
    },
    orderBy: [
      { workOrder: { orderId: "asc" } },
      { taskNumber: "asc" },
    ],
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <CreateTaskDialog
          orgSlug={slug}
          orders={activeOrders.map((o) => ({
            id: o.id,
            orderId: o.orderId,
            clientName: `${o.client.firstName} ${o.client.lastName}`,
            address: o.addressLine1,
          }))}
          staffMembers={[
            ...new Map(staffMemberships.map((m) => [m.userId, { id: m.userId, name: m.user.name }])).values(),
          ]}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Suspense fallback={null}>
          <TaskStatusFilter slug={slug} currentStatus={status} showMineOnly={showMineOnly} />
        </Suspense>
      </div>

      <TasksClient tasks={tasks} slug={slug} />
    </div>
  )
}
