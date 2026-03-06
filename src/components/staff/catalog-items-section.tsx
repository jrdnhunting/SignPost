"use client"

import { useState, useTransition } from "react"
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
import { createCatalogItem, updateCatalogItem, deleteCatalogItem } from "@/actions/catalog-items"
import { Pencil, Trash2, Check, X } from "lucide-react"

type CatalogItemType = "MAIN_SERVICE" | "ADD_ON" | "PRODUCT" | "FEE"

interface CatalogItem {
  id: string
  name: string
  description: string | null
  price: string | null
  serviceType: CatalogItemType
  isActive: boolean
  sortOrder: number
}

interface Props {
  orgId: string
  orgSlug: string
  initialItems: CatalogItem[]
}

const TYPE_LABELS: Record<CatalogItemType, string> = {
  MAIN_SERVICE: "Main Service",
  ADD_ON: "Add-On",
  PRODUCT: "Product",
  FEE: "Fee",
}

const TYPES: CatalogItemType[] = ["MAIN_SERVICE", "ADD_ON", "PRODUCT", "FEE"]

export function CatalogItemsSection({ orgId, orgSlug, initialItems }: Props) {
  const [items, setItems] = useState<CatalogItem[]>(initialItems)
  const [isPending, startTransition] = useTransition()
  const [showAddRow, setShowAddRow] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Add form state
  const [addName, setAddName] = useState("")
  const [addDesc, setAddDesc] = useState("")
  const [addPrice, setAddPrice] = useState("")
  const [addType, setAddType] = useState<CatalogItemType>("MAIN_SERVICE")

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editType, setEditType] = useState<CatalogItemType>("MAIN_SERVICE")

  function startEdit(item: CatalogItem) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditDesc(item.description ?? "")
    setEditPrice(item.price ?? "")
    setEditType(item.serviceType)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function handleAdd() {
    if (!addName.trim()) return
    startTransition(async () => {
      const raw = await createCatalogItem(
        { organizationId: orgId, name: addName.trim(), description: addDesc.trim() || undefined, price: addPrice || undefined, serviceType: addType },
        orgSlug
      )
      setItems((prev) => [...prev, { ...raw, price: raw.price != null ? String(raw.price) : null }])
      setAddName(""); setAddDesc(""); setAddPrice(""); setAddType("MAIN_SERVICE")
      setShowAddRow(false)
    })
  }

  function handleSaveEdit(id: string) {
    startTransition(async () => {
      const raw = await updateCatalogItem(
        id,
        { name: editName.trim(), description: editDesc.trim() || undefined, price: editPrice || null, serviceType: editType },
        orgSlug
      )
      setItems((prev) => prev.map((item) => item.id === id ? { ...raw, price: raw.price != null ? String(raw.price) : null } : item))
      setEditingId(null)
    })
  }

  function handleToggleActive(item: CatalogItem) {
    startTransition(async () => {
      const raw = await updateCatalogItem(item.id, { isActive: !item.isActive }, orgSlug)
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...raw, price: raw.price != null ? String(raw.price) : null } : i))
    })
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this catalog item?")) return
    startTransition(async () => {
      await deleteCatalogItem(id, orgSlug)
      setItems((prev) => prev.filter((i) => i.id !== id))
    })
  }

  return (
    <div className="space-y-3">
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600 w-32">Type</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-24">Price</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 w-20">Active</th>
              <th className="px-3 py-2 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 && !showAddRow && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-400 text-xs">
                  No catalog items yet
                </td>
              </tr>
            )}
            {items.map((item) =>
              editingId === item.id ? (
                <tr key={item.id} className="bg-blue-50">
                  <td className="px-3 py-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="h-7 text-sm mt-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={editType} onValueChange={(v) => setEditType(v as CatalogItemType)}>
                      <SelectTrigger className="h-7 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="0.00"
                      className="h-7 text-sm text-right"
                    />
                  </td>
                  <td />
                  <td className="px-2 py-2">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveEdit(item.id)} disabled={isPending}>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                        <X className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className={item.isActive ? "bg-white" : "bg-gray-50 opacity-60"}>
                  <td className="px-3 py-2">
                    <p className="font-medium">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{TYPE_LABELS[item.serviceType]}</td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {item.price ? `$${parseFloat(item.price).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      disabled={isPending}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                        item.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(item)}>
                        <Pencil className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(item.id)} disabled={isPending}>
                        <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            )}
            {showAddRow && (
              <tr className="bg-blue-50">
                <td className="px-3 py-2">
                  <Input
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Item name *"
                    className="h-7 text-sm"
                    autoFocus
                  />
                  <Input
                    value={addDesc}
                    onChange={(e) => setAddDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="h-7 text-sm mt-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <Select value={addType} onValueChange={(v) => setAddType(v as CatalogItemType)}>
                    <SelectTrigger className="h-7 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                    placeholder="0.00"
                    className="h-7 text-sm text-right"
                  />
                </td>
                <td />
                <td className="px-2 py-2">
                  <div className="flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAdd} disabled={isPending || !addName.trim()}>
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setShowAddRow(false); setAddName(""); setAddDesc(""); setAddPrice("") }}>
                      <X className="h-3.5 w-3.5 text-gray-400" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!showAddRow && (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowAddRow(true)}>
          + Add item
        </Button>
      )}
    </div>
  )
}
