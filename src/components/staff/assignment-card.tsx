import { cn } from "@/lib/utils"
import { ASSIGNMENT_STATUS_LABELS } from "@/lib/constants"

const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  ACCEPTED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
}

interface AssignmentCardProps {
  assignment: {
    id: string
    status: string
    notes: string | null
    assignedAt: Date
    user: {
      name: string
      email: string
    }
  }
}

export default function AssignmentCard({ assignment }: AssignmentCardProps) {
  const { user, status, notes, assignedAt } = assignment
  const label = ASSIGNMENT_STATUS_LABELS[status] ?? status
  const colorClass = ASSIGNMENT_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            colorClass
          )}
        >
          {label}
        </span>
      </div>

      {notes && (
        <p className="mt-3 text-sm text-muted-foreground border-t pt-3">{notes}</p>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        Assigned{" "}
        {new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(assignedAt instanceof Date ? assignedAt : new Date(assignedAt))}
      </p>
    </div>
  )
}
