import { cn } from "@/lib/utils"
import {
  WO_STATUS_LABELS,
  WO_STATUS_COLORS,
  WO_PRIORITY_LABELS,
  WO_PRIORITY_COLORS,
} from "@/lib/constants"

interface WorkOrderStatusBadgeProps {
  status: string
  className?: string
}

export function WorkOrderStatusBadge({ status, className }: WorkOrderStatusBadgeProps) {
  const label = WO_STATUS_LABELS[status] ?? status
  const colorClass = WO_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}

interface WorkOrderPriorityBadgeProps {
  priority: string
  className?: string
}

export function WorkOrderPriorityBadge({ priority, className }: WorkOrderPriorityBadgeProps) {
  const label = WO_PRIORITY_LABELS[priority] ?? priority
  const colorClass = WO_PRIORITY_COLORS[priority] ?? "bg-gray-100 text-gray-600"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}
