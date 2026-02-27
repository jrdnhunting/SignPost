"use client"

import { useState, useTransition } from "react"
import { createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from "@/actions/clients"
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

const PAYMENT_TYPES = [
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer / ACH" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
]

interface PaymentMethod {
  id: string
  type: string
  label: string
  isDefault: boolean
  notes: string | null
}

interface EditState {
  id: string
  type: string
  label: string
  notes: string
}

export function PaymentMethodsCard({
  clientId,
  orgSlug,
  initialMethods,
}: {
  clientId: string
  orgSlug: string
  initialMethods: PaymentMethod[]
}) {
  const [methods, setMethods] = useState(initialMethods)
  const [showAdd, setShowAdd] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [isPending, startTransition] = useTransition()

  // Add form state
  const [addType, setAddType] = useState("credit_card")
  const [addLabel, setAddLabel] = useState("")
  const [addNotes, setAddNotes] = useState("")
  const [addDefault, setAddDefault] = useState(methods.length === 0)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const pm = await createPaymentMethod(
        { clientId, type: addType, label: addLabel, notes: addNotes, isDefault: addDefault },
        orgSlug
      )
      setMethods((prev) => {
        const updated = addDefault ? prev.map((m) => ({ ...m, isDefault: false })) : prev
        return [...updated, pm]
      })
      setAddLabel("")
      setAddNotes("")
      setAddDefault(false)
      setShowAdd(false)
    })
  }

  function startEdit(pm: PaymentMethod) {
    setEditState({ id: pm.id, type: pm.type, label: pm.label, notes: pm.notes ?? "" })
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editState) return
    startTransition(async () => {
      const updated = await updatePaymentMethod(
        editState.id,
        { type: editState.type, label: editState.label, notes: editState.notes },
        clientId,
        orgSlug
      )
      setMethods((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
      setEditState(null)
    })
  }

  function handleSetDefault(pm: PaymentMethod) {
    startTransition(async () => {
      await updatePaymentMethod(pm.id, { isDefault: true }, clientId, orgSlug)
      setMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m.id === pm.id }))
      )
    })
  }

  function handleDelete(pm: PaymentMethod) {
    startTransition(async () => {
      await deletePaymentMethod(pm.id, clientId, orgSlug)
      setMethods((prev) => prev.filter((m) => m.id !== pm.id))
    })
  }

  const typeLabel = (type: string) =>
    PAYMENT_TYPES.find((t) => t.value === type)?.label ?? type

  return (
    <div className="space-y-3">
      {methods.length === 0 && !showAdd && (
        <p className="text-sm text-gray-500">No payment methods on file.</p>
      )}

      {methods.map((pm) =>
        editState?.id === pm.id ? (
          <form key={pm.id} onSubmit={handleSaveEdit} className="border rounded-md p-3 bg-gray-50 space-y-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={editState.type} onValueChange={(v) => setEditState((s) => s && { ...s, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Label</Label>
              <Input
                value={editState.label}
                onChange={(e) => setEditState((s) => s && { ...s, label: e.target.value })}
                placeholder="e.g. Chase Visa ••••4242"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input
                value={editState.notes}
                onChange={(e) => setEditState((s) => s && { ...s, notes: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditState(null)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div key={pm.id} className="flex items-start justify-between border rounded-md p-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{pm.label}</span>
                {pm.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                    Default
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">{typeLabel(pm.type)}</span>
              {pm.notes && <p className="text-xs text-gray-400 mt-0.5">{pm.notes}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {!pm.isDefault && (
                <button
                  onClick={() => handleSetDefault(pm)}
                  disabled={isPending}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Set default
                </button>
              )}
              <button
                onClick={() => startEdit(pm)}
                className="text-xs text-gray-500 hover:text-gray-800 ml-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(pm)}
                disabled={isPending}
                className="text-xs text-red-500 hover:text-red-700 ml-1"
              >
                Remove
              </button>
            </div>
          </div>
        )
      )}

      {showAdd ? (
        <form onSubmit={handleAdd} className="border rounded-md p-3 bg-gray-50 space-y-3">
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={addType} onValueChange={setAddType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Label *</Label>
            <Input
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
              placeholder="e.g. Chase Visa ••••4242"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Input
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={addDefault}
              onChange={(e) => setAddDefault(e.target.checked)}
              className="rounded"
            />
            Set as default
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending || !addLabel.trim()}>
              {isPending ? "Saving…" : "Add method"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setShowAdd(false); setAddLabel(""); setAddNotes("") }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          + Add payment method
        </Button>
      )}
    </div>
  )
}
