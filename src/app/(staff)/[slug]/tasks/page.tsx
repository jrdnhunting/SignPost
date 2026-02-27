export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { formatDate, formatAddress, formatOrderId } from "@/lib/utils"
import {
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_TYPE_COLORS,
} from "@/lib/constants"
import { TaskStatusFilter } from "./task-status-filter"
import { CreateTaskDialog } from "./create-task-dialog"
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

  const grouped = tasks.reduce<Record<string, typeof tasks>>((acc, task) => {
    const key = task.workOrderId
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

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

      {tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-lg border">
          <p>No tasks found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([woId, woTasks]) => {
            const wo = woTasks[0].workOrder
            return (
              <div key={woId} className="bg-white rounded-lg border overflow-hidden">
                {/* Order header */}
                <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                  <div>
                    <Link
                      href={`/${slug}/orders/${woId}`}
                      className="font-semibold text-blue-600 hover:underline font-mono"
                    >
                      #{formatOrderId(wo.orderId)}
                    </Link>
                    <span className="text-gray-400 mx-2">·</span>
                    <span className="text-sm text-gray-600">
                      {wo.client.firstName} {wo.client.lastName}
                    </span>
                    <span className="text-gray-400 mx-2">·</span>
                    <span className="text-sm text-gray-500">{formatAddress(wo)}</span>
                  </div>
                </div>

                {/* Tasks in this order */}
                <div className="divide-y">
                  {woTasks.map((task) => (
                    <div key={task.id} className="px-4 py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="font-mono text-xs text-gray-400 shrink-0">
                          {formatOrderId(wo.orderId)}-{String(task.taskNumber).padStart(2, "0")}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                            TASK_TYPE_COLORS[task.taskType] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {TASK_TYPE_LABELS[task.taskType] ?? task.taskType}
                        </span>
                        {task.assignedTo && (
                          <span className="text-sm text-gray-600 truncate">
                            {task.assignedTo.name}
                          </span>
                        )}
                        {task.preferredDate && (
                          <span className="text-xs text-gray-400 shrink-0">
                            Preferred: {formatDate(task.preferredDate)}
                          </span>
                        )}
                        {task.notes && (
                          <span className="text-xs text-gray-400 italic truncate">{task.notes}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            TASK_STATUS_COLORS[task.status] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {TASK_STATUS_LABELS[task.status] ?? task.status}
                        </span>
                        <Link
                          href={`/${slug}/orders/${woId}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
