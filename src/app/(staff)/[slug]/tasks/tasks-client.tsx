"use client"
import { useState } from "react"
import Link from "next/link"
import { formatDate, formatAddress, formatOrderId } from "@/lib/utils"
import {
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_TYPE_COLORS,
} from "@/lib/constants"
import { TaskPanel } from "@/components/staff/task-panels/task-panel"
import { useRouter } from "next/navigation"

interface TaskItem {
  id: string
  taskType: string
  taskNumber: number
  status: string
  preferredDate: Date | null
  notes: string | null
  assignedTo: { id: string; name: string } | null
  workOrder: {
    id: string
    orderId: number
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    postalCode: string
    client: { firstName: string; lastName: string }
  } | null
}

interface TasksClientProps {
  tasks: TaskItem[]
  slug: string
}

export function TasksClient({ tasks, slug }: TasksClientProps) {
  const router = useRouter()
  const [openPanelTaskId, setOpenPanelTaskId] = useState<string | null>(null)

  const grouped = tasks.reduce<Record<string, TaskItem[]>>((acc, task) => {
    const key = task.workOrder?.id ?? `unlinked-${task.id}`
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 bg-white rounded-lg border">
        <p>No tasks found.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(grouped).map(([groupKey, woTasks]) => {
          const wo = woTasks[0].workOrder
          return (
            <div key={groupKey} className="bg-white rounded-lg border overflow-hidden">
              {/* Order header */}
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <div>
                  {wo ? (
                    <>
                      <Link
                        href={`/${slug}/orders/${wo.id}`}
                        className="font-semibold text-blue-600 hover:underline font-mono"
                        onClick={(e) => e.stopPropagation()}
                      >
                        #{formatOrderId(wo.orderId)}
                      </Link>
                      <span className="text-gray-400 mx-2">·</span>
                      <span className="text-sm text-gray-600">
                        {wo.client.firstName} {wo.client.lastName}
                      </span>
                      <span className="text-gray-400 mx-2">·</span>
                      <span className="text-sm text-gray-500">{formatAddress(wo)}</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 italic">Unlinked removal request</span>
                  )}
                </div>
              </div>

              {/* Tasks in this order */}
              <div className="divide-y">
                {woTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setOpenPanelTaskId(task.id)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-4 hover:bg-blue-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {wo && (
                        <span className="font-mono text-xs text-gray-400 shrink-0">
                          {formatOrderId(wo.orderId)}-{String(task.taskNumber).padStart(2, "0")}
                        </span>
                      )}
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
                      <span className="text-xs text-blue-500">Open →</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {openPanelTaskId && (
        <TaskPanel
          taskId={openPanelTaskId}
          orgSlug={slug}
          open={!!openPanelTaskId}
          onOpenChange={(open) => { if (!open) setOpenPanelTaskId(null) }}
          onCompleted={() => router.refresh()}
        />
      )}
    </>
  )
}
