export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import PortalNav from "@/components/portal/portal-nav"

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const session = await auth()

  if (!session?.user || session.user.type !== "client" || session.user.clientId !== clientId) {
    redirect("/portal/login")
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client) redirect("/portal/login")

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNav
        clientName={client.companyName ?? `${client.firstName} ${client.lastName}`}
        userName={session.user.name ?? ""}
      />
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
