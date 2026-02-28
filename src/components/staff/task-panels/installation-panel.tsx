"use client"
import { useState, useTransition } from "react"
import { completeTaskWithData } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GpsCapture, type GpsPoint } from "./gps-capture"
import { TaskPhotoUpload } from "./task-photo-upload"
import { formatAddress, formatClientName, formatDate } from "@/lib/utils"
import { Plus, X } from "lucide-react"

const POST_TYPES = [
  { value: "vinyl_post", label: "Vinyl Post" },
  { value: "metal_post", label: "Metal Post" },
  { value: "wooden_post", label: "Wooden Post" },
  { value: "metal_panel_holder", label: "Metal Panel Holder" },
  { value: "coroplast_sign", label: "Coroplast Sign" },
]
const LOCATIONS = [
  { value: "front_yard", label: "Front Yard" },
  { value: "side_yard", label: "Side Yard" },
  { value: "back_yard", label: "Back Yard" },
]

interface InstallationPanelProps {
  task: { id: string; status: string; completedAt: Date | null; completionData: Record<string, unknown> | null; notes: string | null }
  workOrder: { orderId: number; addressLine1: string; addressLine2: string | null; city: string; state: string; postalCode: string; orderNotes: string | null; locationNotes: string | null }
  client: { firstName: string; lastName: string; companyName: string | null; clientNotesPublic: string | null }
  orgSlug: string
  onCompleted: () => void
}

export function InstallationPanel({ task, workOrder, client, orgSlug, onCompleted }: InstallationPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const saved = (task.completionData ?? {}) as Record<string, unknown>
  const isCompleted = task.status === "COMPLETED"

  const [postType, setPostType] = useState((saved.postType as string) ?? "")
  const [numPosts, setNumPosts] = useState((saved.numPosts as number) ?? 1)
  const [inventoryNumbers, setInventoryNumbers] = useState<string[]>(
    (saved.inventoryNumbers as string[]) ?? [""]
  )
  const [installLocation, setInstallLocation] = useState((saved.installLocation as string) ?? "")
  const [accessories, setAccessories] = useState<string[]>((saved.accessories as string[]) ?? [])
  const [hasSignPanel, setHasSignPanel] = useState<boolean | null>(
    saved.hasSignPanel === undefined ? null : (saved.hasSignPanel as boolean)
  )
  const [signPanelPhotoUrl, setSignPanelPhotoUrl] = useState<string | null>(
    (saved.signPanelPhotoUrl as string) ?? null
  )
  const [hasRider, setHasRider] = useState<boolean | null>(
    saved.hasRider === undefined ? null : (saved.hasRider as boolean)
  )
  const [riderPhotoUrls, setRiderPhotoUrls] = useState<string[]>(
    (saved.riderPhotoUrls as string[]) ?? []
  )
  const [gps, setGps] = useState<GpsPoint | null>((saved.gps as GpsPoint) ?? null)
  const [sitePhotoUrl, setSitePhotoUrl] = useState<string | null>((saved.sitePhotoUrl as string) ?? null)
  const [notes, setNotes] = useState((saved.notes as string) ?? "")

  function toggleAccessory(val: string) {
    setAccessories((prev) =>
      prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]
    )
  }

  function handleNumPostsChange(n: number) {
    const clamped = Math.max(1, n)
    setNumPosts(clamped)
    setInventoryNumbers((prev) => {
      const arr = [...prev]
      while (arr.length < clamped) arr.push("")
      return arr.slice(0, clamped)
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        await completeTaskWithData(
          task.id,
          {
            postType, numPosts,
            inventoryNumbers: inventoryNumbers.filter(Boolean),
            installLocation, accessories,
            hasSignPanel, signPanelPhotoUrl,
            hasRider, riderPhotoUrls,
            gps, sitePhotoUrl, notes: notes || undefined,
          },
          orgSlug
        )
        onCompleted()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to complete task")
      }
    })
  }

  if (isCompleted) {
    const postLabel = POST_TYPES.find((p) => p.value === saved.postType)?.label ?? saved.postType as string
    const locationLabel = LOCATIONS.find((l) => l.value === saved.installLocation)?.label ?? saved.installLocation as string
    return (
      <div className="space-y-3 text-sm">
        <Row label="Post Type" value={postLabel} />
        <Row label="Posts Installed" value={String(saved.numPosts ?? 1)} />
        <Row label="Location" value={locationLabel} />
        <Row label="Accessories" value={((saved.accessories as string[]) ?? []).join(", ") || "None"} />
        <Row label="Sign Panel" value={saved.hasSignPanel ? "Yes" : "No"} />
        <Row label="Rider" value={saved.hasRider ? "Yes" : "No"} />
        {!!saved.sitePhotoUrl && (
          <div><p className="text-gray-500 mb-1">Site Photo</p><img src={saved.sitePhotoUrl as string} className="h-28 rounded-md border object-cover" alt="Site" /></div>
        )}
        <p className="text-green-600 text-center pt-2">Completed {task.completedAt ? formatDate(task.completedAt) : ""}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Order reference */}
      <div className="grid grid-cols-2 gap-3 pb-4 border-b text-sm">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Address</p>
          <p className="text-gray-900">{formatAddress(workOrder)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Client</p>
          <p className="text-gray-900">{formatClientName(client)}</p>
        </div>
        {workOrder.orderNotes && (
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Order Notes</p>
            <p className="text-gray-700 bg-gray-50 rounded p-2 text-xs">{workOrder.orderNotes}</p>
          </div>
        )}
        {workOrder.locationNotes && (
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Access Notes</p>
            <p className="text-gray-700 bg-gray-50 rounded p-2 text-xs">{workOrder.locationNotes}</p>
          </div>
        )}
        {client.clientNotesPublic && (
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Client Notes</p>
            <p className="text-gray-700 bg-gray-50 rounded p-2 text-xs">{client.clientNotesPublic}</p>
          </div>
        )}
      </div>

      {/* Post type */}
      <div className="space-y-1">
        <Label>Post Type *</Label>
        <Select value={postType} onValueChange={setPostType} required>
          <SelectTrigger><SelectValue placeholder="Select post type" /></SelectTrigger>
          <SelectContent>
            {POST_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Number of posts */}
      <div className="space-y-1">
        <Label>Number of Posts *</Label>
        <Input
          type="number"
          min={1}
          value={numPosts}
          onChange={(e) => handleNumPostsChange(Number(e.target.value))}
        />
      </div>

      {/* Inventory numbers */}
      <div className="space-y-2">
        <Label>Post Inventory Number{numPosts > 1 ? "s" : ""} (optional)</Label>
        {inventoryNumbers.map((inv, i) => (
          <Input
            key={i}
            value={inv}
            onChange={(e) => {
              const arr = [...inventoryNumbers]
              arr[i] = e.target.value
              setInventoryNumbers(arr)
            }}
            placeholder={numPosts > 1 ? `Post ${i + 1} inventory #` : "Inventory number"}
          />
        ))}
      </div>

      {/* Install location */}
      <div className="space-y-1">
        <Label>Installation Location *</Label>
        <Select value={installLocation} onValueChange={setInstallLocation}>
          <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
          <SelectContent>
            {LOCATIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Accessories */}
      <div className="space-y-2">
        <Label>Accessories (optional)</Label>
        <div className="flex gap-4">
          {[{ value: "solar_light", label: "Solar Light" }, { value: "info_box", label: "Info Box" }].map((acc) => (
            <label key={acc.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={accessories.includes(acc.value)}
                onChange={() => toggleAccessory(acc.value)}
                className="rounded"
              />
              {acc.label}
            </label>
          ))}
        </div>
      </div>

      {/* Sign panel */}
      <div className="space-y-2">
        <Label>Did you install a sign panel? *</Label>
        <div className="flex gap-4">
          {[true, false].map((val) => (
            <label key={String(val)} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="hasSignPanel"
                checked={hasSignPanel === val}
                onChange={() => setHasSignPanel(val)}
              />
              {val ? "Yes" : "No"}
            </label>
          ))}
        </div>
        {hasSignPanel && (
          <TaskPhotoUpload label="Sign panel photo (optional)" value={signPanelPhotoUrl} onChange={setSignPanelPhotoUrl} />
        )}
      </div>

      {/* Rider */}
      <div className="space-y-2">
        <Label>Did you install a rider? *</Label>
        <div className="flex gap-4">
          {[true, false].map((val) => (
            <label key={String(val)} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="hasRider"
                checked={hasRider === val}
                onChange={() => setHasRider(val)}
              />
              {val ? "Yes" : "No"}
            </label>
          ))}
        </div>
        {hasRider && (
          <div className="space-y-2">
            {riderPhotoUrls.map((url, i) => (
              <div key={i} className="relative inline-block mr-2">
                <img src={url} className="h-24 w-auto rounded-md border object-cover" alt={`Rider ${i + 1}`} />
                <button type="button" onClick={() => setRiderPhotoUrls((p) => p.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 bg-white rounded-full border shadow-sm p-0.5 text-gray-500 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <TaskPhotoUpload
              label={riderPhotoUrls.length === 0 ? "Rider photo (optional)" : "Add another rider photo"}
              value={null}
              onChange={(url) => { if (url) setRiderPhotoUrls((p) => [...p, url]) }}
            />
          </div>
        )}
      </div>

      {/* GPS */}
      <div className="space-y-1">
        <Label>GPS Location *</Label>
        <GpsCapture value={gps} onChange={setGps} required />
      </div>

      {/* Site photo */}
      <TaskPhotoUpload label="Photo of sign in front of house" required value={sitePhotoUrl} onChange={setSitePhotoUrl} />

      {/* Notes */}
      <div className="space-y-1">
        <Label>Installation Notes (optional)</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes…" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Completing…" : "Complete Installation"}
      </Button>
    </form>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  )
}
