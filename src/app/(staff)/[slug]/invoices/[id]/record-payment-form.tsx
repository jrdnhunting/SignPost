"use client"
import { useState, useTransition } from "react"
import { recordPayment } from "@/actions/invoices"
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

interface RecordPaymentFormProps {
  invoiceId: string
  orgSlug: string
}

export function RecordPaymentForm({ invoiceId, orgSlug }: RecordPaymentFormProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("CHECK")
  const [reference, setReference] = useState("")
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await recordPayment(
        invoiceId,
        { amount: parseFloat(amount), method, reference, paidAt, notes },
        orgSlug
      )
      setAmount("")
      setReference("")
      setNotes("")
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Record Payment
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-md p-4 space-y-3 bg-gray-50 mt-3"
    >
      <h4 className="font-medium text-sm">Record Payment</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="pay-amount">Amount ($)</Label>
          <Input
            id="pay-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="CHECK">Check</SelectItem>
              <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
              <SelectItem value="ACH">ACH</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="pay-ref">Reference</Label>
          <Input
            id="pay-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Check #, card last 4..."
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pay-date">Payment Date</Label>
          <Input
            id="pay-date"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Recording..." : "Record Payment"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
