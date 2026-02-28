"use client"
import { useState, useTransition } from "react"
import { completeTaskWithData } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GpsCapture, type GpsPoint } from "./gps-capture"
import { TaskPhotoUpload } from "./task-photo-upload"
import { formatAddress, formatClientName, formatDate } from "@/lib/utils"

interface ServicePanelProps {
  task: { id: string; status: string; completedAt: Date | null; completionData: Record<string, unknown> | null }
  workOrder: { orderId: number; addressLine1: string; addressLine2: string | null; city: string; state: string; postalCode: string; orderNotes: string | null }
  client: { firstName: string; lastName: string; companyName: string | null }
  orgSlug: string
  onCompleted: () => void
}

export function ServicePanel({ task, workOrder, client, orgSlug, onCompleted }: ServicePanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const saved = (task.completionData ?? {}) as Record<string, unknown>
  const isCompleted = task.status === "COMPLETED"

  const [reasonForVisit, setReasonForVisit] = useState((saved.reasonForVisit as string) ?? "")
  const [workPerformed, setWorkPerformed] = useState((saved.workPerformed as string) ?? "")
  const [partsUsed, setPartsUsed] = useState((saved.partsUsed as string) ?? "")
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState<string | null>((saved.completionPhotoUrl as string) ?? null)
  const [gps, setGps] = useState<GpsPoint | null>((saved.gps as GpsPoint) ?? null)
  const [notes, setNotes] = useState((saved.notes as string) ?? "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        await completeTaskWithData(
          task.id,
          {
            reasonForVisit: reasonForVisit || undefined,
            workPerformed,
            partsUsed: partsUsed || undefined,
            completionPhotoUrl,
            gps,
            notes: notes || undefined,
          },
          orgSlug
        )
        onCompleted()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to complete task")
      }
    })
  }

  if (isCompleted) {
    return (
      <div className="space-y-3 text-sm">
        {!!saved.reasonForVisit && <Row label="Reason for Visit" value={saved.reasonForVisit as string} />}
        <Row label="Work Performed" value={saved.workPerformed as string} />
        {!!saved.partsUsed && <Row label="Parts Used" value={saved.partsUsed as string} />}
        {!!saved.completionPhotoUrl && (
          <div><p className="text-gray-500 mb-1">Completion Photo</p><img src={saved.completionPhotoUrl as string} className="h-28 rounded-md border object-cover" alt="Completion" /></div>
        )}
        <p className="text-green-600 text-center pt-2">Completed {task.completedAt ? formatDate(task.completedAt) : ""}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Reference */}
      <div className="grid grid-cols-2 gap-3 pb-4 border-b text-sm">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Address</p>
          <p className="text-gray-900">{formatAddress(workOrder)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Client</p>
          <p className="text-gray-900">{formatClientName(client)}</p>
        </div>
        {workOrder.orderNotes && (
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Order Notes</p>
            <p className="text-gray-700 bg-gray-50 rounded p-2 text-xs">{workOrder.orderNotes}</p>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label>Reason for Visit (optional)</Label>
        <Input value={reasonForVisit} onChange={(e) => setReasonForVisit(e.target.value)} placeholder="Describe the issue or reason…" />
      </div>

      <div className="space-y-1">
        <Label>Work Performed *</Label>
        <Textarea rows={3} value={workPerformed} onChange={(e) => setWorkPerformed(e.target.value)} placeholder="Describe what was done…" required />
      </div>

      <div className="space-y-1">
        <Label>Parts Used or Replaced (optional)</Label>
        <Input value={partsUsed} onChange={(e) => setPartsUsed(e.target.value)} placeholder="e.g. Replacement post, vinyl panel…" />
      </div>

      <TaskPhotoUpload label="Completion photo (optional)" value={completionPhotoUrl} onChange={setCompletionPhotoUrl} />

      <div className="space-y-1">
        <Label>GPS Location (optional)</Label>
        <GpsCapture value={gps} onChange={setGps} />
      </div>

      <div className="space-y-1">
        <Label>Notes (optional)</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes…" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Completing…" : "Complete Service Task"}
      </Button>
    </form>
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
