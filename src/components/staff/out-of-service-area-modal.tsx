"use client"

import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

interface SerializedServiceArea {
  id: string
  name: string
  polygon: object
  pricingAdjustment: string | null
}

interface OutOfServiceAreaModalProps {
  serviceAreas: SerializedServiceArea[]
  addressPoint: { lat: number; lng: number } | null
  onOverride: () => void
  onCancel: () => void
}

const MiniMap = dynamic(() => import("./out-of-service-area-map"), { ssr: false })

export function OutOfServiceAreaModal({
  serviceAreas,
  addressPoint,
  onOverride,
  onCancel,
}: OutOfServiceAreaModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Address Outside Service Area</h2>
        <p className="text-sm text-gray-600">
          The address you entered does not fall within any defined service zone. You can override and proceed, or cancel to correct the address.
        </p>
        {addressPoint && (
          <div className="rounded-md overflow-hidden border h-48">
            <MiniMap serviceAreas={serviceAreas} addressPoint={addressPoint} />
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onOverride}>
            Override &amp; Proceed
          </Button>
        </div>
      </div>
    </div>
  )
}
