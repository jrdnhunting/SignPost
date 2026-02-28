"use client"
import { useState, useTransition } from "react"
import { createTask } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_TYPE_COLORS,
} from "@/lib/constants"
import { formatDate, formatOrderId } from "@/lib/utils"
import { Plus } from "lucide-react"
import { TaskPanel } from "@/components/staff/task-panels/task-panel"
import { useRouter } from "next/navigation"

interface Task {
  id: string
  taskType: string
  taskNumber: number
  status: string
  assignedTo: { id: string; name: string } | null
  preferredDate: Date | null
  scheduledDate: Date | null
  notes: string | null
  completedAt: Date | null
  requesterName: string | null
  requesterPhone: string | null
}

interface TaskListProps {
  tasks: Task[]
  workOrderId: string
  orderId: number
  orgSlug: string
  staffMembers: { id: string; name: string }[]
  canCreateTasks: boolean
}

export function TaskList({
  tasks,
  workOrderId,
  orderId,
  orgSlug,
  staffMembers,
  canCreateTasks,
}: TaskListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTaskType, setNewTaskType] = useState<string>("")
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("none")
  const [newTaskNotes, setNewTaskNotes] = useState("")

  const [openPanelTaskId, setOpenPanelTaskId] = useState<string | null>(null)

  function handleCreateTask() {
    if (!newTaskType) return
    startTransition(async () => {
      await createTask(
        {
          workOrderId,
          taskType: newTaskType as any,
          assignedToId: newTaskAssignee && newTaskAssignee !== "none" ? newTaskAssignee : null,
          notes: newTaskNotes || undefined,
        },
        orgSlug
      )
      setShowCreateForm(false)
      setNewTaskType("")
      setNewTaskAssignee("none")
      setNewTaskNotes("")
    })
  }

  const TASK_TYPES = [
    "CONFIRM_ORDER",
    "UTILITY_MARKING",
    "INSTALLATION",
    "REMOVAL",
    "REMOVAL_REQUEST",
    "SERVICE",
  ] as const

  return (
    <div className="space-y-3">
      {tasks.length === 0 && (
        <p className="text-gray-500 text-sm">No tasks for this order.</p>
      )}

      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          onClick={() => setOpenPanelTaskId(task.id)}
          className={`w-full text-left border rounded-lg p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40 ${
            task.status === "COMPLETED" ? "bg-gray-50 opacity-75" : "bg-white"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-gray-400">
                  {formatOrderId(orderId)}-{String(task.taskNumber).padStart(2, "0")}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    TASK_TYPE_COLORS[task.taskType] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {TASK_TYPE_LABELS[task.taskType] ?? task.taskType}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    TASK_STATUS_COLORS[task.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {TASK_STATUS_LABELS[task.status] ?? task.status}
                </span>
              </div>
              {task.assignedTo && (
                <p className="text-sm text-gray-600 mt-1">
                  Assigned to: <span className="font-medium">{task.assignedTo.name}</span>
                </p>
              )}
              {task.requesterName && (
                <p className="text-sm text-gray-600 mt-1">
                  Requested by: <span className="font-medium">{task.requesterName}</span>
                  {task.requesterPhone && ` · ${task.requesterPhone}`}
                </p>
              )}
              {task.scheduledDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Scheduled: {formatDate(task.scheduledDate)}
                </p>
              )}
              {task.notes && (
                <p className="text-xs text-gray-500 mt-1 italic">{task.notes}</p>
              )}
              {task.completedAt && (
                <p className="text-xs text-green-600 mt-1">
                  Completed {formatDate(task.completedAt)}
                </p>
              )}
            </div>
            <span className="text-xs text-blue-500 shrink-0 mt-1">Open →</span>
          </div>
        </button>
      ))}

      {/* Create Task */}
      {canCreateTasks && (
        <>
          {!showCreateForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="mt-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Task
            </Button>
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <h4 className="font-medium text-sm">New Task</h4>
              <div className="space-y-1">
                <Label className="text-xs">Task Type *</Label>
                <Select value={newTaskType} onValueChange={setNewTaskType}>
                  <SelectTrigger className="h-9">
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
                <Label className="text-xs">Assign To</Label>
                <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                  <SelectTrigger className="h-9">
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
                <Label className="text-xs">Notes</Label>
                <Textarea
                  className="text-xs"
                  rows={2}
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={isPending || !newTaskType}
                  onClick={handleCreateTask}
                >
                  {isPending ? "Creating..." : "Create Task"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewTaskType("")
                    setNewTaskAssignee("none")
                    setNewTaskNotes("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Task panel dialog */}
      {openPanelTaskId && (
        <TaskPanel
          taskId={openPanelTaskId}
          orgSlug={orgSlug}
          open={!!openPanelTaskId}
          onOpenChange={(open) => { if (!open) setOpenPanelTaskId(null) }}
          onCompleted={() => router.refresh()}
        />
      )}
    </div>
  )
}
