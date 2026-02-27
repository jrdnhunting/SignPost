"use client"

import { useRef, useState, useTransition } from "react"
import { updateClient } from "@/actions/clients"

interface Props {
  clientId: string
  orgSlug: string
  currentPhotoUrl: string | null
  displayName: string
}

export function ClientPhotoUpload({ clientId, orgSlug, currentPhotoUrl, displayName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl)
  const [isPending, startTransition] = useTransition()

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)

    startTransition(async () => {
      const fd = new FormData()
      fd.append("photo", file)
      const res = await fetch("/api/upload/client-photo", { method: "POST", body: fd })
      if (!res.ok) return
      const { url } = await res.json()
      await updateClient(clientId, { profilePhotoUrl: url }, orgSlug)
    })
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Change photo"
      >
        {preview ? (
          <img src={preview} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
            {initials}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xs font-medium">
            {isPending ? "Uploading…" : "Change"}
          </span>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      <span className="text-xs text-gray-400">Click to change photo</span>
    </div>
  )
}
