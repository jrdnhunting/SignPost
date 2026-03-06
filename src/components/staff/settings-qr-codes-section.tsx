"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Download } from "lucide-react"

interface Props {
  orgSlug: string
  websiteUrl: string | null
  baseUrl: string
}

function QRPanel({ label, url, hint }: { label: string; url: string | null; hint?: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    QRCode.toDataURL(url, { width: 200, margin: 2 }).then(setDataUrl).catch(() => {})
  }, [url])

  if (!url) {
    return (
      <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-gray-50 flex-1">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 text-center">{hint}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-white flex-1">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {dataUrl ? (
        <>
          <img src={dataUrl} alt={`QR code for ${label}`} className="w-36 h-36" />
          <p className="text-xs text-gray-400 text-center break-all max-w-full px-2">{url}</p>
          <a
            href={dataUrl}
            download={`${label.toLowerCase().replace(/\s+/g, "-")}-qr.png`}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <Download className="h-3 w-3" /> Download
          </a>
        </>
      ) : (
        <div className="w-36 h-36 bg-gray-100 rounded animate-pulse" />
      )}
    </div>
  )
}

export function SettingsQRCodesSection({ orgSlug, websiteUrl, baseUrl }: Props) {
  const removalUrl = `${baseUrl}/removal-request/${orgSlug}`

  return (
    <div className="flex gap-4">
      <QRPanel label="Removal Request Form" url={removalUrl} />
      <QRPanel
        label="Company Homepage"
        url={websiteUrl || null}
        hint="Set a Website URL in Company Details to generate this QR code"
      />
    </div>
  )
}
