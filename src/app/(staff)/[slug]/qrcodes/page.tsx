export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { QRCodesPageClient } from "./qrcodes-client"

export default async function QRCodesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const org = await prisma.organization.findUniqueOrThrow({ where: { slug } })

  const [qrCodes, rawClients] = await Promise.all([
    prisma.qRCode.findMany({
      where: { organizationId: org.id },
      include: { client: { select: { id: true, firstName: true, lastName: true, companyName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      where: { organizationId: org.id },
      select: { id: true, firstName: true, lastName: true, companyName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ])

  const clients = rawClients.map((c) => ({
    id: c.id,
    label: `${c.firstName} ${c.lastName}${c.companyName ? ` (${c.companyName})` : ""}`,
  }))

  const serialized = qrCodes.map((q) => ({
    id: q.id,
    name: q.name,
    code: q.code,
    targetUrl: q.targetUrl,
    clientId: q.clientId,
    clientLabel: q.client
      ? `${q.client.firstName} ${q.client.lastName}${q.client.companyName ? ` (${q.client.companyName})` : ""}`
      : null,
  }))

  const hdrs = await headers()
  const host = hdrs.get("host") ?? "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  const baseUrl = `${protocol}://${host}`

  return (
    <div className="p-8 max-w-5xl">
      <QRCodesPageClient
        orgId={org.id}
        orgSlug={slug}
        initialQRCodes={serialized}
        clients={clients}
        baseUrl={baseUrl}
      />
    </div>
  )
}
