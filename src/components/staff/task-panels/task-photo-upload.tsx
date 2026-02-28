"use client"
import { useRef, useState } from "react"
import { Camera, X } from "lucide-react"

interface TaskPhotoUploadProps {
  label?: string
  required?: boolean
  value: string | null
  onChange: (url: string | null) => void
}

export function TaskPhotoUpload({ label, required, value, onChange }: TaskPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  async function handleFile(file: File) {
    setError("")
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("photo", file)
      const res = await fetch("/api/upload/task-photo", { method: "POST", body: fd })
      if (!res.ok) throw new Error("Upload failed")
      const { url } = await res.json()
      onChange(url)
    } catch {
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1">
      {label && (
        <p className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
      )}
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Uploaded"
            className="h-32 w-auto rounded-md border object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-1.5 -right-1.5 bg-white rounded-full border shadow-sm p-0.5 text-gray-500 hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 w-full justify-center"
        >
          <Camera className="h-4 w-4" />
          {uploading ? "Uploading…" : "Tap to take photo or upload"}
        </button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
