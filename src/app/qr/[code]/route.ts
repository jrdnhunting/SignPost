export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const qr = await prisma.qRCode.findUnique({ where: { code } })
  if (!qr) return new Response("Not found", { status: 404 })
  return Response.redirect(qr.targetUrl, 302)
}
