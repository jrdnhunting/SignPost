"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, RefreshCw } from "lucide-react"

export interface GpsPoint {
  lat: number
  lng: number
}

interface GpsCaptureProps {
  value: GpsPoint | null
  onChange: (gps: GpsPoint | null) => void
  required?: boolean
}

export function GpsCapture({ value, onChange, required }: GpsCaptureProps) {
  const [status, setStatus] = useState<"idle" | "capturing" | "done" | "error">("idle")

  useEffect(() => {
    capture()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function capture() {
    if (!navigator.geolocation) {
      setStatus("error")
      return
    }
    setStatus("capturing")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus("done")
      },
      () => {
        setStatus("error")
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm bg-gray-50">
      <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
      {status === "capturing" && (
        <span className="text-gray-500 flex-1">Capturing location…</span>
      )}
      {status === "done" && value && (
        <span className="text-gray-700 flex-1 font-mono text-xs">
          {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </span>
      )}
      {(status === "idle" || status === "error") && (
        <span className={`flex-1 ${status === "error" ? "text-red-500" : "text-gray-400"}`}>
          {status === "error" ? "Location unavailable" : "Not captured"}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 shrink-0"
        onClick={capture}
        disabled={status === "capturing"}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${status === "capturing" ? "animate-spin" : ""}`} />
      </Button>
    </div>
  )
}
