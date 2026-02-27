"use client"

import { MapContainer, TileLayer, Polygon, Marker } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default marker icon in webpack
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface SerializedServiceArea {
  id: string
  name: string
  polygon: object
  pricingAdjustment: string | null
}

interface Props {
  serviceAreas: SerializedServiceArea[]
  addressPoint: { lat: number; lng: number }
}

export default function OutOfServiceAreaMap({ serviceAreas, addressPoint }: Props) {
  return (
    <MapContainer
      center={[addressPoint.lat, addressPoint.lng]}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {serviceAreas.map((area) => {
        const geo = area.polygon as any
        const coords: [number, number][] =
          geo?.coordinates?.[0]?.map(([lng, lat]: [number, number]) => [lat, lng]) ?? []
        return (
          <Polygon
            key={area.id}
            positions={coords}
            pathOptions={{ color: "#3b82f6", fillOpacity: 0.2 }}
          />
        )
      })}
      <Marker position={[addressPoint.lat, addressPoint.lng]} icon={icon} />
    </MapContainer>
  )
}
