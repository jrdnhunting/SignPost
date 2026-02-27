"use client"
import { useState, useTransition } from "react"
import { updateTaskStatus, createTask } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Check, Clock, Plus, X } from "lucide-react"

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
  const [isPending, startTransition] = useTransition()
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [confirmScheduledDate, setConfirmScheduledDate] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTaskType, setNewTaskType] = useState<string>("")
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("none")
  const [newTaskNotes, setNewTaskNotes] = useState("")

  function handleComplete(task: Task) {
    if (task.taskType === "CONFIRM_ORDER") {
      // Must enter scheduled install date before completing
      setCompletingTask(task.id)
    } else {
      startTransition(async () => {
        await updateTaskStatus(task.id, "COMPLETED", { orgSlug })
      })
    }
  }

  function handleConfirmOrderComplete(taskId: string) {
    startTransition(async () => {
      await updateTaskStatus(taskId, "COMPLETED", {
        scheduledDate: confirmScheduledDate || undefined,
        orgSlug,
      })
      setCompletingTask(null)
      setConfirmScheduledDate("")
    })
  }

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
        <div
          key={task.id}
          className={`border rounded-lg p-4 ${
            task.status === "COMPLETED"
              ? "bg-gray-50 opacity-75"
              : "bg-white"
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
              {task.preferredDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Preferred date: {formatDate(task.preferredDate)}
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

            {/* Actions */}
            {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
              <div className="shrink-0">
                {task.taskType === "CONFIRM_ORDER" && completingTask === task.id ? (
                  <div className="flex flex-col gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Scheduled Install Date</Label>
                      <Input
                        type="date"
                        className="text-xs h-8"
                        value={confirmScheduledDate}
                        onChange={(e) => setConfirmScheduledDate(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleConfirmOrderComplete(task.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setCompletingTask(null); setConfirmScheduledDate("") }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleComplete(task)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Complete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
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
                    setNewTaskAssignee("")
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
    </div>
  )
}
