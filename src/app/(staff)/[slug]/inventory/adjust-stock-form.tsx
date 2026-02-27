"use client"
import { useState, useTransition } from "react"
import { recordTransaction } from "@/actions/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AdjustStockFormProps {
  orgSlug: string
  items: { id: string; name: string }[]
}

export function AdjustStockForm({ orgSlug, items }: AdjustStockFormProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [itemId, setItemId] = useState("")
  const [txType, setTxType] = useState("ADJUSTMENT")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const qty = parseInt(quantity, 10)
      await recordTransaction(
        {
          inventoryItemTypeId: itemId,
          type: txType,
          quantity: txType === "CONSUME" ? -Math.abs(qty) : Math.abs(qty),
          notes,
        },
        orgSlug
      )
      setItemId("")
      setQuantity("")
      setNotes("")
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Adjust Stock
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-md p-4 space-y-3 bg-gray-50 mb-4"
    >
      <h4 className="font-medium text-sm">Record Stock Movement</h4>
      <div className="space-y-1">
        <Label>Item</Label>
        <Select value={itemId} onValueChange={setItemId}>
          <SelectTrigger>
            <SelectValue placeholder="Select item" />
          </SelectTrigger>
          <SelectContent>
            {items.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Type</Label>
          <Select value={txType} onValueChange={setTxType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RESTOCK">Restock</SelectItem>
              <SelectItem value="CONSUME">Consume</SelectItem>
              <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
              <SelectItem value="RETURN">Return</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="qty">Quantity</Label>
          <Input
            id="qty"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="tx-notes">Notes</Label>
        <Input
          id="tx-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reason for adjustment..."
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || !itemId}>
          {isPending ? "Saving..." : "Record"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
