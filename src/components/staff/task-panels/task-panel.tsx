"use client"
import { useState, useEffect, useCallback } from "react"
import { getTaskPanelData, derivePaymentStatus } from "@/actions/tasks"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TASK_TYPE_LABELS } from "@/lib/constants"
import { formatOrderId } from "@/lib/utils"
import { ConfirmOrderPanel } from "./confirm-order-panel"
import { UtilityMarkingPanel } from "./utility-marking-panel"
import { InstallationPanel } from "./installation-panel"
import { RemovalPanel } from "./removal-panel"
import { RemovalRequestPanel } from "./removal-request-panel"
import { ServicePanel } from "./service-panel"

type TaskPanelData = Awaited<ReturnType<typeof getTaskPanelData>>

interface TaskPanelProps {
  taskId: string
  orgSlug: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

export function TaskPanel({ taskId, orgSlug, open, onOpenChange, onCompleted }: TaskPanelProps) {
  const [data, setData] = useState<TaskPanelData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await getTaskPanelData(taskId)
      setData(d)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  function handleCompleted() {
    load() // refresh panel data
    onCompleted?.()
  }

  const title = data
    ? `${TASK_TYPE_LABELS[data.taskType] ?? data.taskType}${data.workOrder ? ` — #${formatOrderId(data.workOrder.orderId)}` : ""}`
    : "Task"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {loading && <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>}

        {!loading && data && (
          <PanelContent data={data} orgSlug={orgSlug} onCompleted={handleCompleted} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PanelContent({ data, orgSlug, onCompleted }: { data: TaskPanelData; orgSlug: string; onCompleted: () => void }) {
  const task = {
    id: data.id,
    status: data.status,
    completedAt: data.completedAt,
    completionData: data.completionData as Record<string, unknown> | null,
    notes: data.notes,
    requesterName: data.requesterName,
    requesterPhone: data.requesterPhone,
    requesterEmail: data.requesterEmail,
    preferredDate: data.preferredDate,
    submissionAddress: data.submissionAddress,
  }
  const wo = data.workOrder
  const client = wo?.client ?? null

  switch (data.taskType) {
    case "CONFIRM_ORDER":
      if (!wo || !client) return <p className="text-sm text-gray-500">Order data unavailable.</p>
      return (
        <ConfirmOrderPanel
          task={task}
          workOrder={wo}
          client={client}
          paymentStatus={derivePaymentStatus(wo.invoices)}
          orgSlug={orgSlug}
          onCompleted={onCompleted}
        />
      )

    case "UTILITY_MARKING":
      if (!wo || !client) return <p className="text-sm text-gray-500">Order data unavailable.</p>
      return (
        <UtilityMarkingPanel
          task={task}
          workOrder={wo}
          client={client}
          orgSlug={orgSlug}
          onCompleted={onCompleted}
        />
      )

    case "INSTALLATION":
      if (!wo || !client) return <p className="text-sm text-gray-500">Order data unavailable.</p>
      return (
        <InstallationPanel
          task={task}
          workOrder={wo}
          client={client}
          orgSlug={orgSlug}
          onCompleted={onCompleted}
        />
      )

    case "REMOVAL":
      if (!wo || !client) return <p className="text-sm text-gray-500">Order data unavailable.</p>
      return (
        <RemovalPanel
          task={task}
          workOrder={wo}
          client={client}
          orgSlug={orgSlug}
          onCompleted={onCompleted}
        />
      )

    case "REMOVAL_REQUEST":
      return (
        <RemovalRequestPanel
          task={task}
          workOrder={wo ?? null}
          client={client}
          orgSlug={orgSlug}
          onCompleted={onCompleted}
        />
      )

    case "SERVICE":
      if (!wo || !client) return <p className="text-sm text-gray-500">Order data unavailable.</p>
      return (
        <ServicePanel
          task={task}
          workOrder={wo}
          client={client}
          orgSlug={orgSlug}
          onCompleted={onCompleted}
        />
      )

    default:
      return <p className="text-sm text-gray-500">Unknown task type.</p>
  }
}
