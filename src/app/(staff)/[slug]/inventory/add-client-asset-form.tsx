"use client"
import { useState, useTransition } from "react"
import { createClientAsset } from "@/actions/client-assets"
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
import { AssetCategory } from "@prisma/client"
import { formatAssetCategory, formatAddress, formatOrderId } from "@/lib/utils"

interface AddClientAssetFormProps {
  organizationId: string
  orgSlug: string
  clients: { id: string; firstName: string; lastName: string; companyName: string | null }[]
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

const CATEGORIES: AssetCategory[] = ["SIGN_PANEL", "SIGN_RIDER", "INFO_BOX", "YARD_SIGN"]

type LocationMode = "work_order" | "technician" | "storage"

export function AddClientAssetForm({
  organizationId,
  orgSlug,
  clients,
  technicians,
  activeWorkOrders,
}: AddClientAssetFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [clientId, setClientId] = useState("")
  const [category, setCategory] = useState<AssetCategory>("SIGN_PANEL")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [notes, setNotes] = useState("")
  const [locationMode, setLocationMode] = useState<LocationMode>("storage")
  const [locationWorkOrderId, setLocationWorkOrderId] = useState("")
  const [locationUserId, setLocationUserId] = useState("")
  const [locationLabel, setLocationLabel] = useState("")

  function reset() {
    setClientId("")
    setCategory("SIGN_PANEL")
    setName("")
    setDescription("")
    setQuantity("1")
    setNotes("")
    setLocationMode("storage")
    setLocationWorkOrderId("")
    setLocationUserId("")
    setLocationLabel("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await createClientAsset(
        {
          organizationId,
          clientId,
          category,
          name,
          description: description || undefined,
          quantity: parseInt(quantity, 10) || 1,
          notes: notes || undefined,
          locationWorkOrderId: locationMode === "work_order" ? locationWorkOrderId || undefined : undefined,
          locationUserId: locationMode === "technician" ? locationUserId || undefined : undefined,
          locationLabel: locationMode === "storage" ? locationLabel || undefined : undefined,
        },
        orgSlug
      )
      reset()
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Add Client Asset</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Client Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="ca-client">Client *</Label>
            <select
              id="ca-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                  {c.companyName ? ` (${c.companyName})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ca-category">Category *</Label>
              <select
                id="ca-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                required
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatAssetCategory(cat)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ca-qty">Quantity</Label>
              <Input
                id="ca-qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ca-name">Name *</Label>
            <Input
              id="ca-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. "Re/Max 18×24 Sign Panel"'
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ca-desc">Description</Label>
            <Input
              id="ca-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
            />
          </div>

          {/* Location picker */}
          <div className="space-y-2">
            <Label>Current Location</Label>
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
                placeholder='e.g. "Org warehouse", "Back of truck"'
              />
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="ca-notes">Notes</Label>
            <Input
              id="ca-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional internal notes"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { reset(); setOpen(false) }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Adding…" : "Add Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
