"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { clockIn, clockOut } from "@/actions/work-logs"

interface ClockWidgetProps {
  workOrderId: string
  userId: string
  activeLog?: { id: string; startedAt: Date } | null
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts = [
    h > 0 ? String(h).padStart(2, "0") : null,
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ].filter(Boolean)
  return parts.join(":")
}

export default function ClockWidget({ workOrderId, userId, activeLog }: ClockWidgetProps) {
  const [isPending, startTransition] = useTransition()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Calculate initial elapsed time if there's an active log
  useEffect(() => {
    if (!activeLog) {
      setElapsedSeconds(0)
      return
    }

    const startedAt =
      activeLog.startedAt instanceof Date
        ? activeLog.startedAt
        : new Date(activeLog.startedAt)

    function tick() {
      const now = new Date()
      const diffMs = now.getTime() - startedAt.getTime()
      setElapsedSeconds(Math.max(0, Math.floor(diffMs / 1000)))
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [activeLog])

  function handleClockIn() {
    startTransition(async () => {
      await clockIn(workOrderId, userId)
    })
  }

  function handleClockOut() {
    if (!activeLog) return
    startTransition(async () => {
      await clockOut(activeLog.id, workOrderId)
    })
  }

  if (!activeLog) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Not clocked in</p>
        <Button onClick={handleClockIn} disabled={isPending} className="w-full">
          {isPending ? "Clocking in..." : "Clock In"}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Time Elapsed
      </p>
      <p className="font-mono text-4xl font-bold tabular-nums text-foreground">
        {formatElapsed(elapsedSeconds)}
      </p>
      <p className="text-xs text-muted-foreground">
        Clocked in at{" "}
        {new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(
          activeLog.startedAt instanceof Date
            ? activeLog.startedAt
            : new Date(activeLog.startedAt)
        )}
      </p>
      <Button
        variant="destructive"
        onClick={handleClockOut}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? "Clocking out..." : "Clock Out"}
      </Button>
    </div>
  )
}
