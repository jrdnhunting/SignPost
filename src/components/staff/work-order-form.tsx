"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createWorkOrder, updateWorkOrder } from "@/actions/work-orders"
import { createClient } from "@/actions/clients"
import { geocodeAddress } from "@/lib/geocode"
import { AddressAutocomplete, type AddressFields } from "@/components/address-autocomplete"
import booleanPointInPolygon from "@turf/boolean-point-in-polygon"
import { point } from "@turf/helpers"

export interface SerializedServiceArea {
  id: string
  name: string
  polygon: object
  pricingAdjustment: string | null
}

type ZoneStatus =
  | { type: "match"; areaId: string; areaName: string; fee: string | null }
  | { type: "outside" }
  | null

const schema = z.object({
  organizationId: z.string().min(1),
  clientId: z.string().min(1, "Client is required"),
  orderNotes: z.string().optional(),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "ZIP is required"),
  country: z.string().default("US"),
  locationNotes: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  listingGoLiveDate: z.string().optional(),
  internalNotes: z.string().optional(),
  serviceAreaId: z.string().optional().nullable(),
  serviceAreaFee: z.string().optional().nullable(),
})

type WorkOrderFormData = z.infer<typeof schema>

type OrderItem = {
  key: string
  description: string
  quantity: number
  unitPrice: string
}

interface WorkOrderFormProps {
  orgSlug: string
  organizationId: string
  clients: { id: string; companyName: string }[]
  defaultValues?: Partial<WorkOrderFormData>
  workOrderId?: string
  serviceAreas?: SerializedServiceArea[]
  catalogItems?: { id: string; name: string; description: string | null; price?: string | null }[]
}

export default function WorkOrderForm({
  orgSlug,
  organizationId,
  clients,
  defaultValues,
  workOrderId,
  serviceAreas = [],
  catalogItems = [],
}: WorkOrderFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isEditing = Boolean(workOrderId)
  const [clientList, setClientList] = useState(clients)
  const [showNewClient, setShowNewClient] = useState(false)
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newCompany, setNewCompany] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [isCreatingClient, setIsCreatingClient] = useState(false)

  // Service area zone checking
  const [zoneStatus, setZoneStatus] = useState<ZoneStatus>(null)
  const [overrideOutOfArea, setOverrideOutOfArea] = useState(false)
  const [geoPoint, setGeoPoint] = useState<{ lat: number; lng: number } | null>(null)

  // Order items (new orders only)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkOrderFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      organizationId,
      country: "US",
      priority: "NORMAL",
      ...defaultValues,
    },
  })

  const watchedClientId = watch("clientId")
  const watchedPriority = watch("priority")

  // Build controlled address value from watched fields
  const addressValue: AddressFields = {
    addressLine1: watch("addressLine1") ?? "",
    addressLine2: watch("addressLine2") ?? "",
    city: watch("city") ?? "",
    state: watch("state") ?? "",
    postalCode: watch("postalCode") ?? "",
    country: watch("country") ?? "US",
  }

  function computeZoneStatus(lat: number, lng: number): ZoneStatus {
    if (serviceAreas.length === 0) return null
    const pt = point([lng, lat])
    const match = serviceAreas.find((area) => {
      try {
        return booleanPointInPolygon(pt, area.polygon as any)
      } catch {
        return false
      }
    })
    return match
      ? { type: "match", areaId: match.id, areaName: match.name, fee: match.pricingAdjustment }
      : { type: "outside" }
  }

  function handleAddressChange(fields: AddressFields) {
    const meaningfulChange =
      fields.addressLine1 !== addressValue.addressLine1 ||
      fields.city !== addressValue.city ||
      fields.state !== addressValue.state ||
      fields.postalCode !== addressValue.postalCode

    setValue("addressLine1", fields.addressLine1)
    setValue("addressLine2", fields.addressLine2 ?? "")
    setValue("city", fields.city)
    setValue("state", fields.state)
    setValue("postalCode", fields.postalCode)
    setValue("country", fields.country ?? "US")

    if (meaningfulChange && serviceAreas.length > 0) {
      setZoneStatus(null)
      setGeoPoint(null)
      setOverrideOutOfArea(false)
    }
  }

  function handleGeoPoint(lat: number, lng: number) {
    setGeoPoint({ lat, lng })
    if (serviceAreas.length > 0) {
      setZoneStatus(computeZoneStatus(lat, lng))
      setOverrideOutOfArea(false)
    }
  }

  async function handleSaveNewClient() {
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim() || !newPhone.trim()) return
    setIsCreatingClient(true)
    const client = await createClient(
      {
        organizationId,
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        companyName: newCompany.trim() || undefined,
        email: newEmail.trim(),
        phone: newPhone.trim(),
      },
      orgSlug
    )
    const label = `${client.firstName} ${client.lastName}`
    setClientList((prev) => [...prev, { id: client.id, companyName: label }])
    setValue("clientId", client.id, { shouldValidate: true })
    setNewFirstName(""); setNewLastName(""); setNewCompany(""); setNewEmail(""); setNewPhone("")
    setShowNewClient(false)
    setIsCreatingClient(false)
  }

  // ── Product item helpers ──────────────────────────────────────────────────

  function addCatalogItem(catalogItem: { id: string; name: string; description: string | null; price?: string | null }) {
    setOrderItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), description: catalogItem.name, quantity: 1, unitPrice: catalogItem.price ?? "" },
    ])
  }

  function addBlankItem() {
    setOrderItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), description: "", quantity: 1, unitPrice: "" },
    ])
  }

  function updateItem(key: string, field: keyof Omit<OrderItem, "key">, value: string | number) {
    setOrderItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item))
    )
  }

  function removeItem(key: string) {
    setOrderItems((prev) => prev.filter((item) => item.key !== key))
  }

  const orderTotal = orderItems.reduce((sum, item) => {
    const price = parseFloat(item.unitPrice) || 0
    return sum + item.quantity * price
  }, 0)

  function onSubmit(data: WorkOrderFormData) {
    startTransition(async () => {
      let finalServiceAreaId: string | null = null
      let finalServiceAreaFee: string | null = null

      if (serviceAreas.length > 0) {
        let status = zoneStatus

        // Fallback geocode if address was entered manually without triggering blur
        if (status === null) {
          const geo = await geocodeAddress({
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: data.country,
          })
          if (geo) {
            setGeoPoint(geo)
            status = computeZoneStatus(geo.lat, geo.lng)
            setZoneStatus(status)
          }
        }

        if (status?.type === "outside" && !overrideOutOfArea) {
          // Don't proceed — user must acknowledge the warning
          return
        }

        if (status?.type === "match") {
          finalServiceAreaId = status.areaId
          finalServiceAreaFee = status.fee
        }
      }

      const payload = { ...data, serviceAreaId: finalServiceAreaId, serviceAreaFee: finalServiceAreaFee }
      if (isEditing && workOrderId) {
        await updateWorkOrder(workOrderId, payload, orgSlug)
      } else {
        const items = orderItems
          .filter((i) => i.description.trim())
          .map((i) => ({
            description: i.description.trim(),
            quantity: Math.max(1, i.quantity),
            unitPrice: parseFloat(i.unitPrice) || 0,
          }))
        const created = await createWorkOrder(payload, orgSlug, items)
        router.push(`/${orgSlug}/orders/${created.id}`)
        return
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Client */}
      <div className="space-y-2">
        <Label htmlFor="clientId">Client *</Label>
        <Select
          value={watchedClientId}
          onValueChange={(val) => {
            if (val === "__new__") {
              setShowNewClient(true)
            } else {
              setValue("clientId", val, { shouldValidate: true })
            }
          }}
        >
          <SelectTrigger id="clientId">
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clientList.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.companyName}
              </SelectItem>
            ))}
            <SelectItem value="__new__" className="text-blue-600 font-medium">
              + Add new client…
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.clientId && (
          <p className="text-xs text-destructive">{errors.clientId.message}</p>
        )}
        {showNewClient && (
          <div className="mt-2 p-3 border rounded-md bg-gray-50 space-y-2">
            <p className="text-xs font-semibold text-gray-700">New client</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">First Name *</Label>
                <Input placeholder="Jane" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} autoFocus />
              </div>
              <div>
                <Label className="text-xs">Last Name *</Label>
                <Input placeholder="Smith" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Company / Brokerage</Label>
              <Input placeholder="Optional" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Email *</Label>
                <Input type="email" placeholder="jane@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Phone *</Label>
                <Input placeholder="(555) 000-0000" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={!newFirstName.trim() || !newLastName.trim() || !newEmail.trim() || !newPhone.trim() || isCreatingClient}
                onClick={handleSaveNewClient}
              >
                {isCreatingClient ? "Saving…" : "Save client"}
              </Button>
              <Button type="button" size="sm" variant="ghost"
                onClick={() => { setShowNewClient(false); setNewFirstName(""); setNewLastName(""); setNewCompany(""); setNewEmail(""); setNewPhone("") }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Order Notes */}
      <div className="space-y-2">
        <Label htmlFor="orderNotes">Order Notes</Label>
        <Textarea
          id="orderNotes"
          placeholder="Notes visible to client, technician, and staff..."
          rows={3}
          {...register("orderNotes")}
        />
      </div>

      {/* Address section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Address</h3>

        <AddressAutocomplete
          value={addressValue}
          onChange={handleAddressChange}
          onGeoPoint={handleGeoPoint}
          fieldErrors={{
            addressLine1: errors.addressLine1?.message,
            city: errors.city?.message,
            state: errors.state?.message,
            postalCode: errors.postalCode?.message,
          }}
          disabled={isPending}
        />

        {/* Inline service area status */}
        {serviceAreas.length > 0 && zoneStatus !== null && (
          <div>
            {zoneStatus.type === "match" ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                <span className="text-green-600">✓</span>
                <span>
                  Service area: <strong>{zoneStatus.areaName}</strong>
                  {zoneStatus.fee && Number(zoneStatus.fee) > 0
                    ? ` · +$${zoneStatus.fee} surcharge`
                    : ""}
                </span>
              </div>
            ) : (
              <div className="px-3 py-3 bg-amber-50 border border-amber-200 rounded-md space-y-2">
                <p className="text-sm font-medium text-amber-800">
                  Address is outside defined service areas
                </p>
                <label className="flex items-center gap-2 text-sm text-amber-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overrideOutOfArea}
                    onChange={(e) => setOverrideOutOfArea(e.target.checked)}
                  />
                  Override and proceed without service area assignment
                </label>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="locationNotes">Location Notes</Label>
          <Textarea
            id="locationNotes"
            placeholder="Gate code, parking instructions, landmarks..."
            rows={2}
            {...register("locationNotes")}
          />
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={watchedPriority}
          onValueChange={(val) =>
            setValue("priority", val as WorkOrderFormData["priority"], { shouldValidate: true })
          }
        >
          <SelectTrigger id="priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="NORMAL">Normal</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listing Go-Live Date */}
      <div className="space-y-2">
        <Label htmlFor="listingGoLiveDate">Listing Go-Live Date</Label>
        <Input id="listingGoLiveDate" type="date" {...register("listingGoLiveDate")} />
      </div>

      {/* Products — new orders only */}
      {!isEditing && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Products</h3>
            <span className="text-xs text-gray-500">Items to be installed</span>
          </div>

          {/* Add product controls */}
          <div className="flex gap-2">
            {catalogItems.length > 0 && (
              <Select
                value=""
                onValueChange={(val) => {
                  const item = catalogItems.find((c) => c.id === val)
                  if (item) addCatalogItem(item)
                }}
              >
                <SelectTrigger className="flex-1 text-sm">
                  <SelectValue placeholder="Add from catalog…" />
                </SelectTrigger>
                <SelectContent>
                  {catalogItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button type="button" variant="outline" size="sm" onClick={addBlankItem}>
              + Custom item
            </Button>
          </div>

          {/* Item rows */}
          {orderItems.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 w-20">Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-28">Unit Price</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-24">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orderItems.map((item) => {
                    const lineTotal = item.quantity * (parseFloat(item.unitPrice) || 0)
                    return (
                      <tr key={item.key} className="bg-white">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.key, "description", e.target.value)}
                            placeholder="Item description"
                            className="w-full bg-transparent focus:outline-none placeholder-gray-400"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(item.key, "quantity", parseInt(e.target.value) || 1)}
                            className="w-full text-center bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-gray-400">$</span>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.key, "unitPrice", e.target.value)}
                              placeholder="0.00"
                              className="w-20 text-right bg-transparent focus:outline-none placeholder-gray-400"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          ${lineTotal.toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right text-sm font-medium text-gray-600">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-semibold text-gray-900">
                      ${orderTotal.toFixed(2)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {orderItems.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3 border border-dashed rounded-md">
              No products added yet
            </p>
          )}
        </div>
      )}

      {/* Internal Notes */}
      <div className="space-y-2">
        <Label htmlFor="internalNotes">Internal Notes</Label>
        <Textarea
          id="internalNotes"
          placeholder="Notes visible to staff only..."
          rows={3}
          {...register("internalNotes")}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending
          ? isEditing ? "Saving..." : "Creating..."
          : isEditing ? "Save Order" : "Create Order"}
      </Button>
    </form>
  )
}
