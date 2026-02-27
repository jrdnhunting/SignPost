"use client"

import { useState, useTransition, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { savePhoto } from "@/actions/photos"
import { ImagePlus, X } from "lucide-react"

interface PhotoUploadProps {
  workOrderId: string
  uploadedById: string
}

type PhotoContext = "BEFORE" | "DURING" | "AFTER" | "ISSUE"

const CONTEXT_LABELS: Record<PhotoContext, string> = {
  BEFORE: "Before",
  DURING: "During",
  AFTER: "After",
  ISSUE: "Issue",
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PhotoUpload({ workOrderId, uploadedById }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [context, setContext] = useState<PhotoContext>("BEFORE")
  const [caption, setCaption] = useState("")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setSuccessMessage(null)
    setErrorMessage(null)

    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  function clearFile() {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return

    setSuccessMessage(null)
    setErrorMessage(null)

    startTransition(async () => {
      try {
        const url = await fileToDataUrl(selectedFile)
        await savePhoto({
          workOrderId,
          uploadedById,
          url,
          context,
          caption: caption.trim() || undefined,
        })
        setSuccessMessage("Photo uploaded successfully.")
        clearFile()
        setCaption("")
        setContext("BEFORE")
      } catch {
        setErrorMessage("Failed to upload photo. Please try again.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Upload Photo</h3>

      {successMessage && (
        <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* File picker */}
      <div className="space-y-2">
        <Label htmlFor="photo-file">Photo *</Label>
        {previewUrl ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="h-40 w-full rounded-md object-cover"
            />
            <button
              type="button"
              onClick={clearFile}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="photo-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 px-4 py-8 text-center hover:border-gray-400"
          >
            <ImagePlus className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-500">
              Tap to choose a photo
            </span>
            <span className="text-xs text-gray-400">JPEG, PNG, HEIC</span>
          </label>
        )}
        <input
          ref={fileInputRef}
          id="photo-file"
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>

      {/* Context */}
      <div className="space-y-2">
        <Label htmlFor="photo-context">Context</Label>
        <Select
          value={context}
          onValueChange={(val) => setContext(val as PhotoContext)}
        >
          <SelectTrigger id="photo-context">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CONTEXT_LABELS) as PhotoContext[]).map((key) => (
              <SelectItem key={key} value={key}>
                {CONTEXT_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <Label htmlFor="photo-caption">Caption</Label>
        <Textarea
          id="photo-caption"
          placeholder="Optional caption..."
          rows={2}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={!selectedFile || isPending} className="w-full">
        {isPending ? "Uploading..." : "Upload Photo"}
      </Button>
    </form>
  )
}
