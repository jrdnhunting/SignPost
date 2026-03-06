"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { WO_STATUS_LABELS } from "@/lib/constants"

interface Client {
  id: string
  label: string
}

interface ServiceArea {
  id: string
  name: string
}

interface Props {
  slug: string
  clients: Client[]
  serviceAreas: ServiceArea[]
}

const selectCls =
  "h-9 rounded-md border border-input bg-white px-3 py-1 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"

export function MapFilterBar({ slug, clients, serviceAreas }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function buildUrl(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, val] of Object.entries(updates)) {
      if (val) {
        params.set(key, val)
      } else {
        params.delete(key)
      }
    }
    return `/${slug}/map?${params.toString()}`
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={searchParams.get("clientId") ?? ""}
        onChange={(e) => router.push(buildUrl({ clientId: e.target.value || null }))}
        className={selectCls}
      >
        <option value="">All clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      {serviceAreas.length > 0 && (
        <select
          value={searchParams.get("serviceAreaId") ?? ""}
          onChange={(e) => router.push(buildUrl({ serviceAreaId: e.target.value || null }))}
          className={selectCls}
        >
          <option value="">All service areas</option>
          {serviceAreas.map((sa) => (
            <option key={sa.id} value={sa.id}>
              {sa.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => router.push(buildUrl({ status: e.target.value || null }))}
        className={selectCls}
      >
        <option value="">All statuses</option>
        {Object.entries(WO_STATUS_LABELS).map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
