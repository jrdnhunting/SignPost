"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { WO_STATUS_LABELS } from "@/lib/constants"

const STATUS_OPTIONS = [
  { value: "", label: "Active (default)" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export function TaskStatusFilter({
  slug,
  currentStatus,
  showMineOnly,
}: {
  slug: string
  currentStatus?: string
  showMineOnly: boolean
}) {
  const mineParam = showMineOnly ? "&mine=1" : ""
  const statusParam = currentStatus ? `?status=${currentStatus}` : ""

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Mine toggle */}
      <Link
        href={`/${slug}/tasks${statusParam}${showMineOnly ? "" : (statusParam ? "&mine=1" : "?mine=1")}`}
        className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
          showMineOnly
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
        }`}
      >
        My Tasks
      </Link>

      {/* Status filter */}
      <div className="flex gap-1 border-b">
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/${slug}/tasks${opt.value ? `?status=${opt.value}` : ""}${mineParam ? (opt.value ? `&mine=1` : "?mine=1") : ""}`}
            className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              currentStatus === opt.value || (!currentStatus && !opt.value)
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
