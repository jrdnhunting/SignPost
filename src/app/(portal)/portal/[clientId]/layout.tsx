export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import PortalNav from "@/components/portal/portal-nav"
import MasqueradeBanner from "@/components/portal/masquerade-banner"

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const session = await auth()

  const cookieStore = await cookies()
  const masqRaw = cookieStore.get("signpost-masquerade")?.value
  let masq: { clientId: string; clientName: string; returnOrgId: string } | null = null
  if (masqRaw) {
    try {
      masq = JSON.parse(masqRaw)
    } catch {
      // ignore invalid cookie
    }
  }

  const isStaffMasq =
    session?.user?.type === "staff" && masq?.clientId === clientId

  if (!isStaffMasq) {
    if (!session?.user || session.user.type !== "client" || session.user.clientId !== clientId) {
      redirect("/portal/login")
    }
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client) redirect("/portal/login")

  const displayName = isStaffMasq
    ? masq!.clientName
    : (session!.user.name ?? "")

  return (
    <div className="min-h-screen bg-gray-50">
      {isStaffMasq && masq && (
        <MasqueradeBanner
          clientName={masq.clientName}
          isSuperAdmin={session?.user?.isSuperAdmin === true}
        />
      )}
      <PortalNav
        clientName={client.companyName ?? `${client.firstName} ${client.lastName}`}
        userName={displayName}
        clientId={clientId}
      />
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
