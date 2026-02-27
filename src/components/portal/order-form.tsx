"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitPortalOrder } from "@/actions/work-orders"
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
  orderNotes: z.string().optional(),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "ZIP is required"),
  country: z.string().default("US"),
  locationNotes: z.string().optional(),
})

type OrderFormData = z.infer<typeof schema>

interface OrderFormProps {
  clientId: string
  submittedById: string
  serviceAreas?: SerializedServiceArea[]
  outOfServiceAreaMessage?: string | null
}

export default function OrderForm({
  clientId,
  submittedById,
  serviceAreas = [],
  outOfServiceAreaMessage,
}: OrderFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [zoneStatus, setZoneStatus] = useState<ZoneStatus>(null)
  const [geoPoint, setGeoPoint] = useState<{ lat: number; lng: number } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { country: "US" },
  })

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
    }
  }

  function handleGeoPoint(lat: number, lng: number) {
    setGeoPoint({ lat, lng })
    if (serviceAreas.length > 0) {
      setZoneStatus(computeZoneStatus(lat, lng))
    }
  }

  async function onSubmit(data: OrderFormData) {
    setSuccessMessage(null)
    setErrorMessage(null)
    setIsLoading(true)

    try {
      let finalServiceAreaId: string | null = null
      let finalServiceAreaFee: number | null = null

      if (serviceAreas.length > 0) {
        let status = zoneStatus

        // Fallback geocode if no status yet
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

        if (status?.type === "outside") {
          // Block portal submission — don't proceed
          return
        }

        if (status?.type === "match") {
          finalServiceAreaId = status.areaId
          finalServiceAreaFee = status.fee ? parseFloat(status.fee) : null
        }
      }

      await submitPortalOrder({
        clientId,
        submittedById,
        orderNotes: data.orderNotes,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        locationNotes: data.locationNotes,
        serviceAreaId: finalServiceAreaId,
        serviceAreaFee: finalServiceAreaFee,
      })
      setSuccessMessage("Your order has been submitted successfully.")
      reset()
      setZoneStatus(null)
      setGeoPoint(null)
    } catch {
      setErrorMessage("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const isOutside = zoneStatus?.type === "outside"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {successMessage && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Order Notes */}
      <div className="space-y-2">
        <Label htmlFor="orderNotes">Order Notes</Label>
        <Textarea
          id="orderNotes"
          placeholder="Any notes or details about this order..."
          rows={3}
          {...register("orderNotes")}
        />
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Installation Address</h3>

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
          disabled={isLoading}
        />

        {/* Inline zone status for portal */}
        {serviceAreas.length > 0 && zoneStatus !== null && (
          <div>
            {zoneStatus.type === "match" ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                <span className="text-green-600">✓</span>
                <span>
                  Address is within our service area
                  {zoneStatus.fee && Number(zoneStatus.fee) > 0
                    ? ` · +$${zoneStatus.fee} surcharge applies`
                    : ""}
                </span>
              </div>
            ) : (
              <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                {outOfServiceAreaMessage ||
                  "This address is outside our current service area. Please contact us for assistance."}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="locationNotes">Location Notes</Label>
          <Textarea
            id="locationNotes"
            placeholder="Access instructions, gate codes, landmarks..."
            rows={2}
            {...register("locationNotes")}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || isOutside}
        className="w-full"
      >
        {isLoading ? "Submitting..." : "Submit Order"}
      </Button>

      {isOutside && (
        <p className="text-xs text-center text-amber-700">
          Update the address to proceed.
        </p>
      )}
    </form>
  )
}
