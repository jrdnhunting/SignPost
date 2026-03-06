export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { ClientProfileForm } from "./profile-form"
import { PortalPaymentMethodsCard } from "./portal-payment-methods-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const session = await auth()

  // Check if this is a staff masquerade session
  const cookieStore = await cookies()
  const masqRaw = cookieStore.get("signpost-masquerade")?.value
  let isStaffMasq = false
  if (masqRaw && session?.user?.type === "staff") {
    try {
      const masq = JSON.parse(masqRaw)
      isStaffMasq = masq.clientId === clientId
    } catch {
      // ignore
    }
  }

  // Layout already guards auth; only add the guard for direct (non-masquerade) access
  // Do NOT redirect if staff is masquerading — that breaks the masquerade view

  const [client, paymentMethods, clientUser] = await Promise.all([
    prisma.client.findUniqueOrThrow({
      where: { id: clientId },
      select: { id: true, companyName: true, phone: true, notificationEmails: true },
    }),
    prisma.clientPaymentMethod.findMany({
      where: { clientId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    // Only fetch clientUser when a real client session is active
    !isStaffMasq && session?.user?.type === "client"
      ? prisma.clientUser.findUnique({
          where: { id: session.user.userId },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve(null),
  ])

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <ClientProfileForm
        userId={clientUser?.id ?? null}
        initialName={clientUser?.name ?? ""}
        initialEmail={clientUser?.email ?? ""}
        clientId={clientId}
        initialCompanyName={client.companyName ?? ""}
        initialPhone={client.phone}
        initialNotificationEmails={client.notificationEmails}
        isMasquerade={isStaffMasq}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <PortalPaymentMethodsCard
            clientId={clientId}
            initialMethods={paymentMethods}
          />
        </CardContent>
      </Card>
    </div>
  )
}
