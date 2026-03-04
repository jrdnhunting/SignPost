"use client"
import { useState, useTransition } from "react"
import { moveClientAsset } from "@/actions/client-assets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatAddress, formatOrderId } from "@/lib/utils"

interface MoveAssetFormProps {
  assetId: string
  assetName: string
  orgSlug: string
  technicians: { id: string; name: string }[]
  activeWorkOrders: {
    id: string
    orderId: number
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    postalCode: string
  }[]
}

type LocationMode = "work_order" | "technician" | "storage"

export function MoveAssetForm({
  assetId,
  assetName,
  orgSlug,
  technicians,
  activeWorkOrders,
}: MoveAssetFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [locationMode, setLocationMode] = useState<LocationMode>("storage")
  const [locationWorkOrderId, setLocationWorkOrderId] = useState("")
  const [locationUserId, setLocationUserId] = useState("")
  const [locationLabel, setLocationLabel] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await moveClientAsset(
        assetId,
        {
          locationWorkOrderId: locationMode === "work_order" ? locationWorkOrderId || null : null,
          locationUserId: locationMode === "technician" ? locationUserId || null : null,
          locationLabel: locationMode === "storage" ? locationLabel || null : null,
        },
        orgSlug
      )
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs">
          Move
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Move Asset</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 mb-2">{assetName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>New Location</Label>
            <div className="flex gap-3">
              {(["storage", "work_order", "technician"] as LocationMode[]).map((mode) => (
                <label key={mode} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="locationMode"
                    value={mode}
                    checked={locationMode === mode}
                    onChange={() => setLocationMode(mode)}
                  />
                  {mode === "storage" ? "Org Storage" : mode === "work_order" ? "At Work Order" : "With Technician"}
                </label>
              ))}
            </div>

            {locationMode === "work_order" && (
              <select
                value={locationWorkOrderId}
                onChange={(e) => setLocationWorkOrderId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="">Select a work order…</option>
                {activeWorkOrders.map((wo) => (
                  <option key={wo.id} value={wo.id}>
                    #{formatOrderId(wo.orderId)} — {formatAddress(wo)}
                  </option>
                ))}
              </select>
            )}

            {locationMode === "technician" && (
              <select
                value={locationUserId}
                onChange={(e) => setLocationUserId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="">Select a technician…</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            {locationMode === "storage" && (
              <Input
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                placeholder='e.g. "Org warehouse"'
              />
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Moving…" : "Move Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
