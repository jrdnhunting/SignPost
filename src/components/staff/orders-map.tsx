"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { formatOrderId, formatAddress, formatClientName, formatDate } from "@/lib/utils"
import { WO_STATUS_LABELS } from "@/lib/constants"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#3b82f6",
  CONFIRMED: "#f59e0b",
  PENDING_INSTALLATION: "#f97316",
  INSTALLED: "#22c55e",
  PENDING_REMOVAL: "#a855f7",
  COMPLETED: "#15803d",
  ON_HOLD: "#9ca3af",
  CANCELLED: "#ef4444",
}

export interface MapWorkOrder {
  id: string
  orderId: number
  status: string
  lat: number | null
  lng: number | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  scheduledDate: string | null
  installedAt: string | null
  scheduledRemovalDate: string | null
  client: {
    firstName: string
    lastName: string
    companyName: string | null
  }
  assignments: {
    status: string
    user: { id: string; name: string }
  }[]
}

function FitBounds({ orders }: { orders: MapWorkOrder[] }) {
  const map = useMap()

  useEffect(() => {
    const points = orders
      .filter((o) => o.lat != null && o.lng != null)
      .map((o) => [o.lat!, o.lng!] as [number, number])

    if (points.length === 0) {
      map.setView([39.5, -98.35], 4)
    } else if (points.length === 1) {
      map.setView(points[0], 13)
    } else {
      // Compute bounding box
      const lats = points.map((p) => p[0])
      const lngs = points.map((p) => p[1])
      map.fitBounds(
        [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)],
        ],
        { padding: [40, 40] }
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

interface Props {
  slug: string
  orders: MapWorkOrder[]
}

export function OrdersMap({ slug, orders }: Props) {
  const placed = orders.filter((o) => o.lat != null && o.lng != null)
  const unplaced = orders.length - placed.length

  return (
    <div className="flex flex-col gap-3">
      {unplaced > 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          {unplaced} order{unplaced !== 1 ? "s" : ""} could not be placed on the map (address could not be geocoded).
        </p>
      )}

      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm" style={{ height: "calc(100vh - 260px)", minHeight: 400 }}>
        <MapContainer
          center={[39.5, -98.35]}
          zoom={4}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds orders={orders} />
          {placed.map((wo) => {
            const color = STATUS_COLORS[wo.status] ?? "#9ca3af"
            const techName =
              wo.assignments.find((a) => a.status !== "DECLINED")?.user.name ?? "Unassigned"

            return (
              <CircleMarker
                key={wo.id}
                center={[wo.lat!, wo.lng!]}
                radius={10}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.85,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => {
                    window.location.href = `/${slug}/orders/${wo.id}`
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div className="text-xs space-y-0.5 min-w-[160px]">
                    <div className="font-semibold text-sm">Order #{formatOrderId(wo.orderId)}</div>
                    <div className="text-gray-600">{formatClientName(wo.client)}</div>
                    <div className="text-gray-500">{formatAddress(wo)}</div>
                    <div className="text-gray-500">
                      Status: <span className="font-medium">{WO_STATUS_LABELS[wo.status] ?? wo.status}</span>
                    </div>
                    {wo.scheduledDate && (
                      <div className="text-gray-500">
                        Scheduled Install: <span className="font-medium">{formatDate(wo.scheduledDate)}</span>
                      </div>
                    )}
                    {wo.installedAt && (
                      <div className="text-gray-500">
                        Installed: <span className="font-medium">{formatDate(wo.installedAt)}</span>
                      </div>
                    )}
                    {wo.scheduledRemovalDate && (
                      <div className="text-gray-500">
                        Scheduled Removal: <span className="font-medium">{formatDate(wo.scheduledRemovalDate)}</span>
                      </div>
                    )}
                    <div className="text-gray-500">
                      Technician: <span className="font-medium">{techName}</span>
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-3 items-center px-1">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="inline-block h-3 w-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
            {WO_STATUS_LABELS[status] ?? status}
          </div>
        ))}
      </div>
    </div>
  )
}
