export interface GeoPoint {
  lat: number
  lng: number
}

export async function geocodeAddress(parts: {
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  postalCode: string
  country?: string
}): Promise<GeoPoint | null> {
  const q = [
    parts.addressLine1,
    parts.addressLine2,
    parts.city,
    parts.state,
    parts.postalCode,
    parts.country ?? "US",
  ]
    .filter(Boolean)
    .join(", ")

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: { "User-Agent": "SignPost/1.0" },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data || data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}
