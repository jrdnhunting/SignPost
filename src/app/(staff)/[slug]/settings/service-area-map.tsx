"use client"

import { useState, useRef } from "react"
import { MapContainer, TileLayer, Polygon, Tooltip, FeatureGroup } from "react-leaflet"
import { EditControl } from "react-leaflet-draw"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createServiceArea, deleteServiceArea, updateServiceArea, setServiceAreaTechnicians } from "@/actions/service-areas"

interface SerializedServiceArea {
  id: string
  name: string
  polygon: object
  pricingAdjustment: string | null
  technicians: { userId: string; user: { id: string; name: string } }[]
}

interface Technician {
  id: string
  name: string
}

interface Props {
  orgId: string
  orgSlug: string
  initialAreas: SerializedServiceArea[]
  technicians: Technician[]
}

interface PendingZone {
  layer: L.Layer
  geoJson: object
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export default function ServiceAreaMap({ orgId, orgSlug, initialAreas, technicians }: Props) {
  const [areas, setAreas] = useState<SerializedServiceArea[]>(initialAreas)
  const [pendingZone, setPendingZone] = useState<PendingZone | null>(null)
  const [newName, setNewName] = useState("")
  const [newFee, setNewFee] = useState("")
  const [newTechIds, setNewTechIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editFee, setEditFee] = useState("")
  const [editTechIds, setEditTechIds] = useState<string[]>([])
  const featureGroupRef = useRef<L.FeatureGroup>(null)

  function handleCreated(e: any) {
    const layer: L.Layer = e.layer
    const geoJson = (layer as any).toGeoJSON().geometry
    setPendingZone({ layer, geoJson })
    setNewName("")
    setNewFee("")
    setNewTechIds([])
  }

  async function handleSaveZone() {
    if (!pendingZone || !newName.trim()) return
    setIsSaving(true)
    try {
      const area = await createServiceArea(
        orgId,
        {
          name: newName.trim(),
          polygon: pendingZone.geoJson,
          pricingAdjustment: newFee ? parseFloat(newFee) : null,
        },
        orgSlug
      )
      if (newTechIds.length > 0) {
        await setServiceAreaTechnicians(area.id, newTechIds, orgSlug)
      }
      const newArea: SerializedServiceArea = {
        id: area.id,
        name: area.name,
        polygon: pendingZone.geoJson,
        pricingAdjustment: area.pricingAdjustment ? String(area.pricingAdjustment) : null,
        technicians: newTechIds.map((uid) => {
          const t = technicians.find((t) => t.id === uid)
          return { userId: uid, user: { id: uid, name: t?.name ?? "" } }
        }),
      }
      setAreas((prev) => [...prev, newArea])
      setPendingZone(null)
      // Remove the drawn layer from the feature group since we now show it as a Polygon
      if (featureGroupRef.current) {
        featureGroupRef.current.removeLayer(pendingZone.layer)
      }
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancelDraw() {
    if (pendingZone && featureGroupRef.current) {
      featureGroupRef.current.removeLayer(pendingZone.layer)
    }
    setPendingZone(null)
  }

  async function handleDelete(id: string) {
    await deleteServiceArea(id, orgSlug)
    setAreas((prev) => prev.filter((a) => a.id !== id))
  }

  function handleStartEdit(area: SerializedServiceArea) {
    setEditingId(area.id)
    setEditName(area.name)
    setEditFee(area.pricingAdjustment ?? "")
    setEditTechIds(area.technicians.map((t) => t.userId))
  }

  async function handleSaveEdit() {
    if (!editingId) return
    setIsSaving(true)
    try {
      await updateServiceArea(editingId, { name: editName, pricingAdjustment: editFee ? parseFloat(editFee) : null }, orgSlug)
      await setServiceAreaTechnicians(editingId, editTechIds, orgSlug)
      setAreas((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? {
                ...a,
                name: editName,
                pricingAdjustment: editFee || null,
                technicians: editTechIds.map((uid) => {
                  const t = technicians.find((t) => t.id === uid)
                  return { userId: uid, user: { id: uid, name: t?.name ?? "" } }
                }),
              }
            : a
        )
      )
      setEditingId(null)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md overflow-hidden border" style={{ height: 400 }}>
        <MapContainer
          center={[39.5, -98.35]}
          zoom={4}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              draw={{
                polygon: true,
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
              }}
              edit={{ edit: false, remove: false }}
            />
          </FeatureGroup>
          {areas.map((area, i) => {
            const geo = area.polygon as any
            const coords: [number, number][] =
              geo?.coordinates?.[0]?.map(([lng, lat]: [number, number]) => [lat, lng]) ?? []
            return (
              <Polygon
                key={area.id}
                positions={coords}
                pathOptions={{ color: COLORS[i % COLORS.length], fillOpacity: 0.25 }}
              >
                <Tooltip sticky>{area.name}</Tooltip>
              </Polygon>
            )
          })}
        </MapContainer>
      </div>

      {/* Pending zone form */}
      {pendingZone && (
        <div className="border rounded-md p-4 bg-blue-50 space-y-3">
          <p className="text-sm font-semibold text-blue-900">New Zone — Fill in details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Zone Name *</Label>
              <Input
                placeholder="e.g. Downtown Core"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pricing Adjustment ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newFee}
                onChange={(e) => setNewFee(e.target.value)}
              />
            </div>
          </div>
          {technicians.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Assigned Technicians</Label>
              <div className="flex flex-wrap gap-3">
                {technicians.map((tech) => (
                  <label key={tech.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTechIds.includes(tech.id)}
                      onChange={(e) =>
                        setNewTechIds((prev) =>
                          e.target.checked ? [...prev, tech.id] : prev.filter((id) => id !== tech.id)
                        )
                      }
                    />
                    {tech.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" disabled={!newName.trim() || isSaving} onClick={handleSaveZone}>
              {isSaving ? "Saving…" : "Save Zone"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelDraw}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Saved zones list */}
      {areas.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Saved Zones</p>
          {areas.map((area, i) => (
            <div key={area.id} className="border rounded-md p-3 space-y-2">
              {editingId === area.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Zone Name *</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Pricing Adjustment ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editFee}
                        onChange={(e) => setEditFee(e.target.value)}
                      />
                    </div>
                  </div>
                  {technicians.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">Assigned Technicians</Label>
                      <div className="flex flex-wrap gap-3">
                        {technicians.map((tech) => (
                          <label key={tech.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editTechIds.includes(tech.id)}
                              onChange={(e) =>
                                setEditTechIds((prev) =>
                                  e.target.checked ? [...prev, tech.id] : prev.filter((id) => id !== tech.id)
                                )
                              }
                            />
                            {tech.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!editName.trim() || isSaving} onClick={handleSaveEdit}>
                      {isSaving ? "Saving…" : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{area.name}</span>
                    {area.pricingAdjustment && Number(area.pricingAdjustment) !== 0 && (
                      <span className="text-xs text-gray-500">(+${area.pricingAdjustment})</span>
                    )}
                    {area.technicians.length > 0 && (
                      <span className="text-xs text-gray-400">
                        · {area.technicians.map((t) => t.user.name).join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleStartEdit(area)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(area.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {areas.length === 0 && !pendingZone && (
        <p className="text-sm text-gray-500">
          Use the polygon tool on the map to draw your first service zone.
        </p>
      )}
    </div>
  )
}
