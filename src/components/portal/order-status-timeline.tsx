"use client"

import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { Check } from "lucide-react"

interface OrderStatusTimelineProps {
  status: string
  submittedAt: Date
  scheduledDate?: Date | null
  completedAt?: Date | null
}

interface TimelineStep {
  key: string
  label: string
  date?: Date | null
}

function getStepState(stepKey: string, currentStatus: string): "done" | "active" | "pending" {
  const ORDER: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    PENDING_INSTALLATION: 2,
    INSTALLED: 3,
    PENDING_REMOVAL: 4,
    COMPLETED: 5,
  }

  const currentOrder = ORDER[currentStatus] ?? -1
  const stepOrder = ORDER[stepKey] ?? 0

  if (currentOrder > stepOrder) return "done"
  if (currentOrder === stepOrder) return "active"
  return "pending"
}

export default function OrderStatusTimeline({
  status,
  submittedAt,
  scheduledDate,
  completedAt,
}: OrderStatusTimelineProps) {
  const steps: TimelineStep[] = [
    {
      key: "PENDING",
      label: "Submitted",
      date: submittedAt,
    },
    {
      key: "CONFIRMED",
      label: "Confirmed",
    },
    {
      key: "PENDING_INSTALLATION",
      label: "Scheduled Install",
      date: scheduledDate,
    },
    {
      key: "INSTALLED",
      label: "Installed",
    },
    {
      key: "COMPLETED",
      label: "Completed",
      date: completedAt,
    },
  ]

  const isCancelled = status === "CANCELLED"
  const isOnHold = status === "ON_HOLD"

  return (
    <div className="space-y-2">
      {(isCancelled || isOnHold) && (
        <div
          className={cn(
            "mb-4 rounded-md px-4 py-2 text-sm font-medium",
            isCancelled ? "bg-red-50 text-red-700" : "bg-purple-50 text-purple-700"
          )}
        >
          {isCancelled ? "This order has been cancelled." : "This order is currently on hold."}
        </div>
      )}

      <ol className="relative">
        {steps.map((step, index) => {
          const state = getStepState(step.key, status)
          const isLast = index === steps.length - 1

          return (
            <li key={step.key} className="relative flex gap-4">
              {/* Line connector */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-4 top-8 h-full w-0.5 -translate-x-1/2",
                    state === "done" ? "bg-green-400" : "bg-gray-200"
                  )}
                />
              )}

              {/* Circle indicator */}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                  state === "done"
                    ? "border-green-500 bg-green-500 text-white"
                    : state === "active"
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-300 bg-white text-gray-400"
                )}
              >
                {state === "done" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-current" />
                )}
              </div>

              {/* Content */}
              <div className={cn("pb-8", isLast && "pb-0")}>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    state === "pending" ? "text-gray-400" : "text-gray-900"
                  )}
                >
                  {step.label}
                </p>
                {step.date && (
                  <p className="mt-0.5 text-xs text-gray-500">{formatDate(step.date)}</p>
                )}
                {state === "active" && !step.date && (
                  <p className="mt-0.5 text-xs text-blue-600">Currently active</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
