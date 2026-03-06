export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  // Optional bearer token protection
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const activeTemplates = await prisma.emailTemplate.findMany({
    where: { isActive: true },
    include: { organization: { select: { id: true } } },
  })

  let processed = 0

  for (const template of activeTemplates) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - template.triggerDays)

    const orders = await prisma.workOrder.findMany({
      where: {
        organizationId: template.organizationId,
        installedAt: { not: null, lte: cutoff },
        status: { notIn: ["PENDING_REMOVAL", "COMPLETED", "CANCELLED"] },
        archivedAt: null,
        emailLogs: { none: { emailTemplateId: template.id } },
      },
      include: { client: { select: { email: true } } },
    })

    for (const order of orders) {
      const recipientEmail = order.client.email
      await prisma.emailLog.create({
        data: {
          emailTemplateId: template.id,
          workOrderId: order.id,
          recipientEmail,
          status: "PENDING",
        },
      })
      // Stub: actual SMTP sending would go here
      console.log(`[email-automation] Would send "${template.subject}" to ${recipientEmail} for order ${order.id}`)
      processed++
    }
  }

  return NextResponse.json({ processed })
}
