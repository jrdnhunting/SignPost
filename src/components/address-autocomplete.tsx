"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { US_STATES } from "@/lib/constants"
import { geocodeAddress } from "@/lib/geocode"

export interface AddressFields {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    house_number?: string
    road?: string
    city?: string
    town?: string
    village?: string
    suburb?: string
    county?: string
    state?: string
    postcode?: string
    country_code?: string
  }
}

function parseNominatimResult(r: NominatimResult): AddressFields & { lat: number; lng: number } {
  const a = r.address
  const line1 = [a.house_number, a.road].filter(Boolean).join(" ")
  const city = a.city ?? a.town ?? a.village ?? a.suburb ?? a.county ?? ""
  const rawState = a.state ?? ""
  const stateCode =
    US_STATES.find((s) => s.label.toLowerCase() === rawState.toLowerCase())?.value ?? rawState
  // Take first 5 chars of postcode (some Nominatim results include +4)
  const postalCode = (a.postcode ?? "").split("-")[0].slice(0, 5)
  return {
    addressLine1: line1,
    addressLine2: "",
    city,
    state: stateCode,
    postalCode,
    country: (a.country_code ?? "us").toUpperCase(),
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }
}

export interface AddressAutocompleteProps {
  value: AddressFields
  onChange: (fields: AddressFields) => void
  /** Called as soon as lat/lng is known — triggers PIP check in parent */
  onGeoPoint: (lat: number, lng: number) => void
  fieldErrors?: {
    addressLine1?: string
    city?: string
    state?: string
    postalCode?: string
  }
  disabled?: boolean
}

type Mode = "search" | "confirmed" | "manual"

export function AddressAutocomplete({
  value,
  onChange,
  onGeoPoint,
  fieldErrors,
  disabled,
}: AddressAutocompleteProps) {
  const hasAddress = Boolean(value.addressLine1 && value.city)
  const [mode, setMode] = useState<Mode>(() => (hasAddress ? "confirmed" : "search"))
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function onMousedown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", onMousedown)
    return () => document.removeEventListener("mousedown", onMousedown)
  }, [])

  const fetchSuggestions = useCallback(async (q: string) => {
    setIsLoading(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=us,ca&q=${encodeURIComponent(q)}`
      const res = await fetch(url, { headers: { "User-Agent": "SignPost/1.0" } })
      if (!res.ok) throw new Error()
      const data: NominatimResult[] = await res.json()
      // Filter to results with a street
      setSuggestions(data.filter((r) => r.address.road))
      setShowDropdown(true)
    } catch {
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 4) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 400)
  }

  function handleSelectSuggestion(r: NominatimResult) {
    const { lat, lng, ...fields } = parseNominatimResult(r)
    onChange(fields)
    onGeoPoint(lat, lng)
    setMode("confirmed")
    setShowDropdown(false)
    setQuery("")
    setSuggestions([])
  }

  async function handleManualGeoOnBlur() {
    if (!value.addressLine1 || !value.city || !value.state || !value.postalCode) return
    setIsGeocoding(true)
    try {
      const geo = await geocodeAddress({
        addressLine1: value.addressLine1,
        addressLine2: value.addressLine2,
        city: value.city,
        state: value.state,
        postalCode: value.postalCode,
        country: value.country || "US",
      })
      if (geo) onGeoPoint(geo.lat, geo.lng)
    } finally {
      setIsGeocoding(false)
    }
  }

  // ── Search mode ────────────────────────────────────────────────────────
  if (mode === "search") {
    return (
      <div ref={containerRef} className="space-y-2">
        <Label>Address *</Label>
        <div className="relative">
          <Input
            placeholder="Start typing an address to search…"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            disabled={disabled}
            autoComplete="off"
          />
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-72 overflow-auto">
              {isLoading && (
                <p className="px-3 py-2 text-xs text-gray-400">Searching…</p>
              )}
              {!isLoading && suggestions.length === 0 && query.length >= 4 && (
                <div className="px-3 py-2 space-y-1">
                  <p className="text-xs text-gray-500">No results for &ldquo;{query}&rdquo;.</p>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onMouseDown={() => { setMode("manual"); setShowDropdown(false) }}
                  >
                    Enter address manually →
                  </button>
                </div>
              )}
              {suggestions.map((r) => (
                <button
                  key={r.place_id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0 leading-snug"
                  onMouseDown={() => handleSelectSuggestion(r)}
                >
                  {r.display_name}
                </button>
              ))}
              {suggestions.length > 0 && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-gray-50 border-t"
                  onMouseDown={() => { setMode("manual"); setShowDropdown(false) }}
                >
                  Enter address manually
                </button>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="text-xs text-blue-600 hover:underline"
          onClick={() => setMode("manual")}
          disabled={disabled}
        >
          Enter address manually
        </button>
      </div>
    )
  }

  // ── Confirmed mode ─────────────────────────────────────────────────────
  if (mode === "confirmed") {
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between p-3 bg-gray-50 rounded-md border">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-0.5">Address</p>
            <p className="text-sm font-medium">{value.addressLine1}</p>
            <p className="text-sm text-gray-600">
              {[value.city, value.state, value.postalCode].filter(Boolean).join(", ")}
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline shrink-0 ml-4"
            onClick={() => { setMode("search"); setQuery("") }}
            disabled={disabled}
          >
            Change
          </button>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Suite / Unit / Apt</Label>
          <Input
            placeholder="Optional"
            value={value.addressLine2 ?? ""}
            onChange={(e) => onChange({ ...value, addressLine2: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
    )
  }

  // ── Manual mode ────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Address *</Label>
        <button
          type="button"
          className="text-xs text-blue-600 hover:underline"
          onClick={() => setMode("search")}
          disabled={disabled}
        >
          ← Search by address
        </button>
      </div>
      <div className="space-y-1">
        <Input
          placeholder="123 Main St"
          value={value.addressLine1}
          onChange={(e) => onChange({ ...value, addressLine1: e.target.value })}
          disabled={disabled}
        />
        {fieldErrors?.addressLine1 && (
          <p className="text-xs text-destructive">{fieldErrors.addressLine1}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-gray-600">Suite / Unit / Apt</Label>
        <Input
          placeholder="Optional"
          value={value.addressLine2 ?? ""}
          onChange={(e) => onChange({ ...value, addressLine2: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">City *</Label>
          <Input
            placeholder="City"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            disabled={disabled}
          />
          {fieldErrors?.city && (
            <p className="text-xs text-destructive">{fieldErrors.city}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">State *</Label>
          <Select
            value={value.state}
            onValueChange={(v) => onChange({ ...value, state: v })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors?.state && (
            <p className="text-xs text-destructive">{fieldErrors.state}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">ZIP Code *</Label>
          <Input
            placeholder="00000"
            value={value.postalCode}
            onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
            onBlur={handleManualGeoOnBlur}
            disabled={disabled}
          />
          {fieldErrors?.postalCode && (
            <p className="text-xs text-destructive">{fieldErrors.postalCode}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Country</Label>
          <Input
            placeholder="US"
            value={value.country}
            onChange={(e) => onChange({ ...value, country: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
      {isGeocoding && (
        <p className="text-xs text-gray-400">Checking service area…</p>
      )}
    </div>
  )
}
