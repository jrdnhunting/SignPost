"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Input } from "@/components/ui/input"

export function WorkOrderSearch({ slug }: { slug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value
      setValue(q)
      const params = new URLSearchParams(searchParams.toString())
      if (q) {
        params.set("q", q)
      } else {
        params.delete("q")
      }
      router.push(`/${slug}/orders?${params.toString()}`)
    },
    [router, searchParams, slug]
  )

  return (
    <Input
      type="search"
      placeholder="Search by order ID or address…"
      value={value}
      onChange={handleChange}
      className="max-w-sm"
    />
  )
}
