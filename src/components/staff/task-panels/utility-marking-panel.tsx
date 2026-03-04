"use client"
import { useState, useTransition } from "react"
import { completeTaskWithData } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatAddress, formatClientName, formatDate } from "@/lib/utils"

interface UtilityMarkingPanelProps {
  task: { id: string; status: string; completedAt: Date | null; completionData: Record<string, unknown> | null }
  workOrder: { orderId: number; addressLine1: string; addressLine2: string | null; city: string; state: string; postalCode: string; serviceArea: { name: string } | null }
  client: { firstName: string; lastName: string; companyName: string | null }
  technicians: { id: string; name: string | null; inServiceArea: boolean }[]
  orgSlug: string
  onCompleted: () => void
}

export function UtilityMarkingPanel({ task, workOrder, client, technicians, orgSlug, onCompleted }: UtilityMarkingPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const saved = (task.completionData ?? {}) as Record<string, string>
  const [submissionDateTime, setSubmissionDateTime] = useState(saved.submissionDateTime ?? "")
  const [referenceNumber, setReferenceNumber] = useState(saved.referenceNumber ?? "")
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState(saved.estimatedCompletionDate ?? "")
  const [scheduledInstallDate, setScheduledInstallDate] = useState(saved.scheduledInstallDate ?? "")
  const [assignedTechnicianId, setAssignedTechnicianId] = useState(saved.assignedTechnicianId ?? "")

  const isCompleted = task.status === "COMPLETED"

  const savedTech = technicians.find((t) => t.id === saved.assignedTechnicianId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        await completeTaskWithData(
          task.id,
          {
            submissionDateTime,
            referenceNumber,
            estimatedCompletionDate: estimatedCompletionDate || undefined,
            scheduledInstallDate,
            assignedTechnicianId,
          },
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
          <Row label="Assigned Technician" value={savedTech?.name ?? saved.assignedTechnicianId ?? "—"} />
          <p className="text-green-600 text-center pt-2">Completed {task.completedAt ? formatDate(task.completedAt) : ""}</p>
          <p className="text-xs text-gray-400 text-center">Installation task has been created and assigned.</p>
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
          <div className="space-y-1">
            <Label>Assign Technician *</Label>
            <Select value={assignedTechnicianId} onValueChange={setAssignedTechnicianId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a technician…" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const inArea = technicians.filter((t) => t.inServiceArea)
                  const others = technicians.filter((t) => !t.inServiceArea)
                  const hasServiceArea = workOrder.serviceArea !== null

                  if (!hasServiceArea || inArea.length === 0) {
                    // No grouping — flat list
                    return technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name ?? tech.id}
                      </SelectItem>
                    ))
                  }

                  return (
                    <>
                      <SelectGroup>
                        <SelectLabel className="text-xs text-green-700">
                          Assigned to {workOrder.serviceArea!.name}
                        </SelectLabel>
                        {inArea.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.name ?? tech.id}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {others.length > 0 && (
                        <>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel className="text-xs text-gray-500">Other Staff</SelectLabel>
                            {others.map((tech) => (
                              <SelectItem key={tech.id} value={tech.id}>
                                {tech.name ?? tech.id}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </>
                      )}
                    </>
                  )
                })()}
              </SelectContent>
            </Select>
            {technicians.length === 0 && (
              <p className="text-xs text-amber-600">No staff members found. Add staff in settings first.</p>
            )}
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending || !assignedTechnicianId}>
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
