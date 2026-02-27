export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"

export default async function PortalClientRoot({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  redirect(`/portal/${clientId}/orders`)
}
