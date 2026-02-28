"use client"
import { useState, useTransition } from "react"
import { completeTaskWithData } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GpsCapture, type GpsPoint } from "./gps-capture"
import { TaskPhotoUpload } from "./task-photo-upload"
import { formatAddress, formatClientName, formatDate } from "@/lib/utils"

const CONDITIONS = [
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "damaged", label: "Damaged" },
]

interface RemovalPanelProps {
  task: { id: string; status: string; completedAt: Date | null; completionData: Record<string, unknown> | null }
  workOrder: { orderId: number; addressLine1: string; addressLine2: string | null; city: string; state: string; postalCode: string }
  client: { firstName: string; lastName: string; companyName: string | null }
  orgSlug: string
  onCompleted: () => void
}

export function RemovalPanel({ task, workOrder, client, orgSlug, onCompleted }: RemovalPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const saved = (task.completionData ?? {}) as Record<string, unknown>
  const isCompleted = task.status === "COMPLETED"

  const [gps, setGps] = useState<GpsPoint | null>((saved.gps as GpsPoint) ?? null)
  const [preRemovalPhotoUrl, setPreRemovalPhotoUrl] = useState<string | null>((saved.preRemovalPhotoUrl as string) ?? null)
  const [removalCondition, setRemovalCondition] = useState((saved.removalCondition as string) ?? "")
  const [collectedPanel, setCollectedPanel] = useState<boolean | null>(
    saved.collectedPanel === undefined ? null : (saved.collectedPanel as boolean)
  )
  const [panelCondition, setPanelCondition] = useState((saved.panelCondition as string) ?? "")
  const [notes, setNotes] = useState((saved.notes as string) ?? "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        await completeTaskWithData(
          task.id,
          { gps, preRemovalPhotoUrl, removalCondition, collectedPanel, panelCondition: collectedPanel ? panelCondition : undefined, notes: notes || undefined },
          orgSlug
        )
        onCompleted()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to complete task")
      }
    })
  }

  if (isCompleted) {
    const conditionLabel = CONDITIONS.find((c) => c.value === saved.removalCondition)?.label ?? saved.removalCondition as string
    const panelCondLabel = CONDITIONS.find((c) => c.value === saved.panelCondition)?.label ?? saved.panelCondition as string
    return (
      <div className="space-y-3 text-sm">
        <Row label="Post Condition" value={conditionLabel} />
        <Row label="Collected Panel" value={saved.collectedPanel ? "Yes" : "No"} />
        {!!saved.collectedPanel && <Row label="Panel Condition" value={panelCondLabel} />}
        {!!saved.preRemovalPhotoUrl && (
          <div><p className="text-gray-500 mb-1">Pre-Removal Photo</p><img src={saved.preRemovalPhotoUrl as string} className="h-28 rounded-md border object-cover" alt="Pre-removal" /></div>
        )}
        <p className="text-green-600 text-center pt-2">Completed {task.completedAt ? formatDate(task.completedAt) : ""}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Reference info */}
      <div className="grid grid-cols-2 gap-3 pb-4 border-b text-sm">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Address</p>
          <p className="text-gray-900">{formatAddress(workOrder)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Client</p>
          <p className="text-gray-900">{formatClientName(client)}</p>
        </div>
      </div>

      {/* GPS */}
      <div className="space-y-1">
        <Label>GPS Location *</Label>
        <GpsCapture value={gps} onChange={setGps} required />
      </div>

      {/* Pre-removal photo */}
      <TaskPhotoUpload label="Pre-removal signpost condition photo" required value={preRemovalPhotoUrl} onChange={setPreRemovalPhotoUrl} />

      {/* Removal condition */}
      <div className="space-y-1">
        <Label>Signpost Removal Condition *</Label>
        <Select value={removalCondition} onValueChange={setRemovalCondition}>
          <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Collected panel */}
      <div className="space-y-2">
        <Label>Did you collect the agent sign panel? *</Label>
        <div className="flex gap-4">
          {[true, false].map((val) => (
            <label key={String(val)} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="collectedPanel" checked={collectedPanel === val} onChange={() => setCollectedPanel(val)} />
              {val ? "Yes" : "No"}
            </label>
          ))}
        </div>
        {collectedPanel && (
          <div className="space-y-1 mt-2">
            <Label>Sign Panel Condition *</Label>
            <Select value={panelCondition} onValueChange={setPanelCondition}>
              <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label>Notes (optional)</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes…" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Completing…" : "Complete Removal"}
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
