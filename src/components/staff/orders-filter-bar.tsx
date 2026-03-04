"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Input } from "@/components/ui/input"

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

export function OrdersFilterBar({ slug, clients, serviceAreas }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get("q") ?? "")

  function buildUrl(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, val] of Object.entries(updates)) {
      if (val) {
        params.set(key, val)
      } else {
        params.delete(key)
      }
    }
    return `/${slug}/orders?${params.toString()}`
  }

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setQ(val)
      router.push(buildUrl({ q: val || null }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, slug]
  )

  const handleClient = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(buildUrl({ clientId: e.target.value || null }))
  }

  const handleServiceArea = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(buildUrl({ serviceAreaId: e.target.value || null }))
  }

  const selectCls =
    "h-9 rounded-md border border-input bg-white px-3 py-1 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Input
        type="search"
        placeholder="Search by order ID or address…"
        value={q}
        onChange={handleSearch}
        className="max-w-xs"
      />

      <select
        value={searchParams.get("clientId") ?? ""}
        onChange={handleClient}
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
          onChange={handleServiceArea}
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
    </div>
  )
}
