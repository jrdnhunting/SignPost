"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createTask } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TASK_TYPE_LABELS } from "@/lib/constants"
import { formatOrderId } from "@/lib/utils"
import { Plus } from "lucide-react"

const TASK_TYPES = [
  "CONFIRM_ORDER",
  "UTILITY_MARKING",
  "INSTALLATION",
  "REMOVAL",
  "REMOVAL_REQUEST",
  "SERVICE",
] as const

interface CreateTaskDialogProps {
  orgSlug: string
  orders: { id: string; orderId: number; clientName: string; address: string }[]
  staffMembers: { id: string; name: string }[]
}

export function CreateTaskDialog({ orgSlug, orders, staffMembers }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [workOrderId, setWorkOrderId] = useState("")
  const [taskType, setTaskType] = useState("")
  const [assignedToId, setAssignedToId] = useState("none")
  const [notes, setNotes] = useState("")

  function reset() {
    setWorkOrderId("")
    setTaskType("")
    setAssignedToId("none")
    setNotes("")
  }

  function handleSubmit() {
    if (!workOrderId || !taskType) return
    startTransition(async () => {
      await createTask(
        {
          workOrderId,
          taskType: taskType as any,
          assignedToId: assignedToId !== "none" ? assignedToId : null,
          notes: notes.trim() || undefined,
        },
        orgSlug
      )
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>Order *</Label>
            <Select value={workOrderId} onValueChange={setWorkOrderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select order" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    #{formatOrderId(o.orderId)} · {o.clientName} · {o.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Task Type *</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TASK_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Assign To</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {staffMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isPending || !workOrderId || !taskType}
              onClick={handleSubmit}
            >
              {isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
