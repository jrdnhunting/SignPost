"use client"
import { useState, useTransition } from "react"
import { processRemovalRequest, searchOrdersForRemoval } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate, formatAddress, formatClientName, formatOrderId } from "@/lib/utils"

interface RemovalRequestPanelProps {
  task: {
    id: string
    status: string
    completedAt: Date | null
    requesterName: string | null
    requesterPhone: string | null
    requesterEmail: string | null
    preferredDate: Date | null
    notes: string | null
    submissionAddress: string | null
    completionData: Record<string, unknown> | null
  }
  workOrder: {
    id: string
    orderId: number
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    postalCode: string
    status: string
  } | null
  client: { firstName: string; lastName: string; companyName: string | null } | null
  orgSlug: string
  onCompleted: () => void
}

interface OrderMatch {
  id: string
  orderId: number
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  status: string
  client: { firstName: string; lastName: string; companyName: string | null }
}

export function RemovalRequestPanel({ task, workOrder, client, orgSlug, onCompleted }: RemovalRequestPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const isCompleted = task.status === "COMPLETED"

  const [scheduledDateTime, setScheduledDateTime] = useState("")
  const [searchQuery, setSearchQuery] = useState(
    task.submissionAddress ?? workOrder?.addressLine1 ?? ""
  )
  const [searchResults, setSearchResults] = useState<OrderMatch[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderMatch | null>(
    workOrder ? { ...workOrder, client: client! } : null
  )

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const results = await searchOrdersForRemoval(searchQuery, orgSlug)
      setSearchResults(results as OrderMatch[])
    } finally {
      setSearching(false)
    }
  }

  function handleProcess() {
    if (!selectedOrder || !scheduledDateTime) return
    setError("")
    startTransition(async () => {
      try {
        await processRemovalRequest(task.id, selectedOrder.id, scheduledDateTime, orgSlug)
        onCompleted()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process request")
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Request details */}
      <div className="bg-gray-50 rounded-md p-3 space-y-2 text-sm">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Request Details</p>
        {task.requesterName && <Row label="Requester" value={task.requesterName} />}
        {task.requesterPhone && <Row label="Phone" value={task.requesterPhone} />}
        {task.requesterEmail && <Row label="Email" value={task.requesterEmail} />}
        {task.preferredDate && <Row label="Preferred Date" value={formatDate(task.preferredDate)} />}
        {task.submissionAddress && <Row label="Submitted Address" value={task.submissionAddress} />}
        {task.notes && <Row label="Notes" value={task.notes} />}
      </div>

      {isCompleted ? (
        <div className="space-y-2 text-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Outcome</p>
          {selectedOrder && <Row label="Linked Order" value={`#${formatOrderId(selectedOrder.orderId)} — ${formatAddress(selectedOrder)}`} />}
          {(task.completionData as any)?.scheduledRemovalDateTime && (
            <Row label="Scheduled Removal" value={new Date((task.completionData as any).scheduledRemovalDateTime).toLocaleString()} />
          )}
          <p className="text-green-600 text-center pt-2">Completed {task.completedAt ? formatDate(task.completedAt) : ""}</p>
        </div>
      ) : (
        <>
          {/* Order match */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              {workOrder ? "Matched Order" : "Find Matching Order"}
            </p>

            {selectedOrder ? (
              <div className="border rounded-md p-3 bg-blue-50 border-blue-200 text-sm flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-blue-900">Order #{formatOrderId(selectedOrder.orderId)}</p>
                  <p className="text-blue-700">{formatAddress(selectedOrder)}</p>
                  <p className="text-blue-600 text-xs">{formatClientName(selectedOrder.client)}</p>
                </div>
                {!workOrder && (
                  <button type="button" onClick={() => setSelectedOrder(null)} className="text-blue-400 hover:text-blue-600 text-xs underline shrink-0">
                    Change
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by address or ZIP…"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch() } }}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleSearch} disabled={searching}>
                    {searching ? "Searching…" : "Search"}
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                    {searchResults.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => { setSelectedOrder(o); setSearchResults([]) }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                      >
                        <span className="font-medium">#{formatOrderId(o.orderId)}</span>
                        <span className="text-gray-500 ml-2">{formatAddress(o)}</span>
                        <span className="text-gray-400 ml-2 text-xs">{formatClientName(o.client)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.length === 0 && searching === false && searchQuery && (
                  <p className="text-xs text-gray-400">No results — try a different address or ZIP.</p>
                )}
              </div>
            )}
          </div>

          {/* Scheduled removal date/time */}
          <div className="space-y-1">
            <Label>Scheduled Removal Date/Time *</Label>
            <Input
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}

          <Button
            className="w-full"
            disabled={isPending || !selectedOrder || !scheduledDateTime}
            onClick={handleProcess}
          >
            {isPending ? "Processing…" : "Create Removal Task & Schedule"}
          </Button>
        </>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  )
}
