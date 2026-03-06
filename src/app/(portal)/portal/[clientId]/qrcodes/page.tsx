export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { PortalQRCodesClient } from "./qrcodes-client"

export default async function PortalQRCodesPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params

  const qrCodes = await prisma.qRCode.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  })

  const hdrs = await headers()
  const host = hdrs.get("host") ?? "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  const baseUrl = `${protocol}://${host}`

  const serialized = qrCodes.map((q) => ({
    id: q.id,
    name: q.name,
    code: q.code,
    targetUrl: q.targetUrl,
  }))

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">My QR Codes</h1>
      <PortalQRCodesClient qrCodes={serialized} baseUrl={baseUrl} />
    </div>
  )
}
