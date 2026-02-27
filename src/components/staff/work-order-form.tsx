"use client"

import { useTransition, useState } from "react"
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
  scheduledDate: z.string().optional(),
  scheduledRemovalDate: z.string().optional(),
  listingGoLiveDate: z.string().optional(),
  internalNotes: z.string().optional(),
  serviceAreaId: z.string().optional().nullable(),
  serviceAreaFee: z.string().optional().nullable(),
})

type WorkOrderFormData = z.infer<typeof schema>

interface WorkOrderFormProps {
  orgSlug: string
  organizationId: string
  clients: { id: string; companyName: string }[]
  defaultValues?: Partial<WorkOrderFormData>
  workOrderId?: string
  serviceAreas?: SerializedServiceArea[]
}

export default function WorkOrderForm({
  orgSlug,
  organizationId,
  clients,
  defaultValues,
  workOrderId,
  serviceAreas = [],
}: WorkOrderFormProps) {
  const [isPending, startTransition] = useTransition()
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
        await createWorkOrder(payload, orgSlug)
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

      {/* Scheduled Install Date */}
      <div className="space-y-2">
        <Label htmlFor="scheduledDate">Scheduled Install Date</Label>
        <Input id="scheduledDate" type="date" {...register("scheduledDate")} />
      </div>

      {/* Scheduled Removal Date */}
      <div className="space-y-2">
        <Label htmlFor="scheduledRemovalDate">Scheduled Removal Date</Label>
        <Input id="scheduledRemovalDate" type="date" {...register("scheduledRemovalDate")} />
      </div>

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
