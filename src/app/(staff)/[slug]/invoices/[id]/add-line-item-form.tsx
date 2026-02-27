"use client"
import { useState, useTransition } from "react"
import { addLineItem } from "@/actions/invoices"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddLineItemFormProps {
  invoiceId: string
  orgSlug: string
}

export function AddLineItemForm({ invoiceId, orgSlug }: AddLineItemFormProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [unitPrice, setUnitPrice] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await addLineItem(
        invoiceId,
        {
          description,
          quantity: parseFloat(quantity),
          unitPrice: parseFloat(unitPrice),
        },
        orgSlug
      )
      setDescription("")
      setQuantity("1")
      setUnitPrice("")
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Add Line Item
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-md p-4 space-y-3 bg-gray-50 mt-3"
    >
      <h4 className="font-medium text-sm">Add Line Item</h4>
      <div className="space-y-1">
        <Label htmlFor="li-desc">Description</Label>
        <Input
          id="li-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Sign installation labor"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="li-qty">Quantity</Label>
          <Input
            id="li-qty"
            type="number"
            min="0.001"
            step="0.001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="li-price">Unit Price ($)</Label>
          <Input
            id="li-price"
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Adding..." : "Add"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
