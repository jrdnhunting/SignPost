export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { NewClientForm } from "./new-client-form"

export default async function NewClientPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const org = await prisma.organization.findUniqueOrThrow({ where: { slug } })

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Client</h1>
      <div className="bg-white rounded-lg border p-6">
        <NewClientForm organizationId={org.id} orgSlug={slug} />
      </div>
    </div>
  )
}
