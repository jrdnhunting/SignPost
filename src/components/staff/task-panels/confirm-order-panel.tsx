"use client"
import { useTransition } from "react"
import { completeTaskWithData } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { formatDate, formatDateTime, formatAddress, formatClientName } from "@/lib/utils"

const PAYMENT_COLORS: Record<string, string> = {
  "Paid": "bg-green-100 text-green-700",
  "Partial": "bg-yellow-100 text-yellow-700",
  "Overdue": "bg-red-100 text-red-700",
  "Sent": "bg-blue-100 text-blue-700",
  "Pending": "bg-gray-100 text-gray-600",
  "No Invoice": "bg-gray-100 text-gray-500",
}

interface ConfirmOrderPanelProps {
  task: {
    id: string
    status: string
    completedAt: Date | null
  }
  workOrder: {
    orderId: number
    createdAt: Date
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    postalCode: string
    orderNotes: string | null
  }
  client: {
    firstName: string
    lastName: string
    companyName: string | null
    email: string
    phone: string
  }
  paymentStatus: string
  orgSlug: string
  onCompleted: () => void
}

export function ConfirmOrderPanel({
  task,
  workOrder,
  client,
  paymentStatus,
  orgSlug,
  onCompleted,
}: ConfirmOrderPanelProps) {
  const [isPending, startTransition] = useTransition()
  const isCompleted = task.status === "COMPLETED"

  function handleConfirm() {
    startTransition(async () => {
      await completeTaskWithData(task.id, {}, orgSlug)
      onCompleted()
    })
  }

  return (
    <div className="space-y-5">
      {/* Address */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Sign Address</p>
        <p className="text-sm text-gray-900">{formatAddress(workOrder)}</p>
      </div>

      {/* Client */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Client</p>
        <p className="text-sm text-gray-900 font-medium">{formatClientName(client)}</p>
        {client.companyName && <p className="text-sm text-gray-600">{client.companyName}</p>}
        <p className="text-sm text-gray-500">{client.email}</p>
        <p className="text-sm text-gray-500">{client.phone}</p>
      </div>

      {/* Submission date */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Submitted</p>
        <p className="text-sm text-gray-900">{formatDateTime(workOrder.createdAt)}</p>
      </div>

      {/* Payment status */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payment Status</p>
        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${PAYMENT_COLORS[paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
          {paymentStatus}
        </span>
      </div>

      {workOrder.orderNotes && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Order Notes</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-md p-2">{workOrder.orderNotes}</p>
        </div>
      )}

      {!isCompleted && (
        <Button className="w-full" disabled={isPending} onClick={handleConfirm}>
          {isPending ? "Confirming…" : "Confirm Order"}
        </Button>
      )}
      {isCompleted && (
        <p className="text-sm text-green-600 text-center">
          Confirmed {task.completedAt ? formatDate(task.completedAt) : ""}
        </p>
      )}
    </div>
  )
}
