"use client"
import { useState, useTransition } from "react"
import { completeTaskWithData } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatAddress, formatClientName, formatDate } from "@/lib/utils"

interface UtilityMarkingPanelProps {
  task: { id: string; status: string; completedAt: Date | null; completionData: Record<string, unknown> | null }
  workOrder: { orderId: number; addressLine1: string; addressLine2: string | null; city: string; state: string; postalCode: string }
  client: { firstName: string; lastName: string; companyName: string | null }
  orgSlug: string
  onCompleted: () => void
}

export function UtilityMarkingPanel({ task, workOrder, client, orgSlug, onCompleted }: UtilityMarkingPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const saved = (task.completionData ?? {}) as Record<string, string>
  const [submissionDateTime, setSubmissionDateTime] = useState(saved.submissionDateTime ?? "")
  const [referenceNumber, setReferenceNumber] = useState(saved.referenceNumber ?? "")
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState(saved.estimatedCompletionDate ?? "")
  const [scheduledInstallDate, setScheduledInstallDate] = useState(saved.scheduledInstallDate ?? "")

  const isCompleted = task.status === "COMPLETED"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        await completeTaskWithData(
          task.id,
          { submissionDateTime, referenceNumber, estimatedCompletionDate: estimatedCompletionDate || undefined, scheduledInstallDate },
          orgSlug
        )
        onCompleted()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to complete task")
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Reference info */}
      <div className="grid grid-cols-2 gap-4 pb-4 border-b">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Sign Address</p>
          <p className="text-sm text-gray-900">{formatAddress(workOrder)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Client</p>
          <p className="text-sm text-gray-900">{formatClientName(client)}</p>
          {client.companyName && <p className="text-xs text-gray-500">{client.companyName}</p>}
        </div>
      </div>

      {isCompleted ? (
        <div className="space-y-3 text-sm">
          <Row label="Submission Date/Time" value={saved.submissionDateTime ? new Date(saved.submissionDateTime).toLocaleString() : "—"} />
          <Row label="Reference Number" value={saved.referenceNumber ?? "—"} />
          <Row label="Estimated Completion" value={saved.estimatedCompletionDate ? formatDate(new Date(saved.estimatedCompletionDate)) : "—"} />
          <Row label="Scheduled Install Date" value={saved.scheduledInstallDate ? formatDate(new Date(saved.scheduledInstallDate)) : "—"} />
          <p className="text-green-600 text-center pt-2">Completed {task.completedAt ? formatDate(task.completedAt) : ""}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Utility Marking Request Submission Date/Time *</Label>
            <Input
              type="datetime-local"
              value={submissionDateTime}
              onChange={(e) => setSubmissionDateTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Reference Number *</Label>
            <Input
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. 811-2026-123456"
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Estimated Marking Completion Date</Label>
            <Input
              type="date"
              value={estimatedCompletionDate}
              onChange={(e) => setEstimatedCompletionDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Scheduled Install Date *</Label>
            <Input
              type="date"
              value={scheduledInstallDate}
              onChange={(e) => setScheduledInstallDate(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : "Complete Utility Marking"}
          </Button>
        </form>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  )
}
