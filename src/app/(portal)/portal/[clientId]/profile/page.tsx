export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
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
  if (!session?.user || session.user.type !== "client") redirect("/portal/login")

  const [clientUser, client, paymentMethods] = await Promise.all([
    prisma.clientUser.findUniqueOrThrow({
      where: { id: session.user.userId },
      select: { id: true, name: true, email: true },
    }),
    prisma.client.findUniqueOrThrow({
      where: { id: clientId },
      select: { id: true, companyName: true, phone: true, notificationEmails: true },
    }),
    prisma.clientPaymentMethod.findMany({
      where: { clientId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
  ])

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <ClientProfileForm
        userId={clientUser.id}
        initialName={clientUser.name}
        initialEmail={clientUser.email}
        clientId={clientId}
        initialCompanyName={client.companyName ?? ""}
        initialPhone={client.phone}
        initialNotificationEmails={client.notificationEmails}
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
