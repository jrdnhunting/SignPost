"use client"
import { useState, useTransition } from "react"
import { createItemType } from "@/actions/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddItemFormProps {
  organizationId: string
  orgSlug: string
}

export function AddItemForm({ organizationId, orgSlug }: AddItemFormProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [unit, setUnit] = useState("each")
  const [reorderPoint, setReorderPoint] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await createItemType(
        {
          organizationId,
          name,
          sku: sku || undefined,
          unit,
          reorderPoint: reorderPoint ? parseInt(reorderPoint, 10) : undefined,
        },
        orgSlug
      )
      setName("")
      setSku("")
      setUnit("each")
      setReorderPoint("")
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Add Item
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-md p-4 space-y-3 bg-gray-50 mb-4"
    >
      <h4 className="font-medium text-sm">Add Inventory Item</h4>
      <div className="space-y-1">
        <Label htmlFor="item-name">Name *</Label>
        <Input
          id="item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 4×8 Aluminum Sheet"
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="item-sku">SKU</Label>
          <Input
            id="item-sku"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="ALU-48"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="item-unit">Unit</Label>
          <Input
            id="item-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="each"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="item-reorder">Reorder At</Label>
          <Input
            id="item-reorder"
            type="number"
            min="0"
            value={reorderPoint}
            onChange={(e) => setReorderPoint(e.target.value)}
            placeholder="5"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Adding..." : "Add Item"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
