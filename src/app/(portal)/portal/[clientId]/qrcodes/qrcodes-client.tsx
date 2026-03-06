"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Download, ExternalLink } from "lucide-react"

interface QRItem {
  id: string
  name: string
  code: string
  targetUrl: string
}

function PortalQRCard({ qr, baseUrl }: { qr: QRItem; baseUrl: string }) {
  const redirectUrl = `${baseUrl}/qr/${qr.code}`
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(redirectUrl, { width: 200, margin: 2 }).then(setDataUrl).catch(() => {})
  }, [redirectUrl])

  return (
    <div className="bg-white border rounded-lg p-4 flex flex-col items-center gap-3">
      <p className="font-medium text-sm text-center">{qr.name}</p>
      {dataUrl ? (
        <img src={dataUrl} alt={`QR code for ${qr.name}`} className="w-40 h-40" />
      ) : (
        <div className="w-40 h-40 bg-gray-100 rounded animate-pulse" />
      )}
      <a
        href={qr.targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:underline flex items-center gap-1 max-w-full truncate"
      >
        {qr.targetUrl.length > 40 ? qr.targetUrl.slice(0, 40) + "…" : qr.targetUrl}
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
      {dataUrl && (
        <a
          href={dataUrl}
          download={`${qr.name.toLowerCase().replace(/\s+/g, "-")}-qr.png`}
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          <Download className="h-3 w-3" /> Download PNG
        </a>
      )}
    </div>
  )
}

export function PortalQRCodesClient({ qrCodes, baseUrl }: { qrCodes: QRItem[]; baseUrl: string }) {
  if (qrCodes.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border">
        <p className="text-gray-500">No QR codes assigned to your account.</p>
        <p className="text-sm text-gray-400 mt-1">
          Contact your sign company if you believe this is an error.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {qrCodes.map((qr) => (
        <PortalQRCard key={qr.id} qr={qr} baseUrl={baseUrl} />
      ))}
    </div>
  )
}
