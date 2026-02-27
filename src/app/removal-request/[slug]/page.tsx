export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import AnonymousRemovalForm from "./anonymous-removal-form"

export default async function AnonymousRemovalPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const org = await prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      removalFormText: true,
      removalFormUrl: true,
    },
  })
  if (!org) notFound()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          {org.logoUrl && (
            <img src={org.logoUrl} alt={org.name} className="h-12 mx-auto mb-4 object-contain" />
          )}
          <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
          <p className="text-gray-500 mt-1">Sign Removal Request</p>
        </div>

        {/* Custom message from org */}
        {org.removalFormText && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
            {org.removalFormText}
          </div>
        )}

        {/* Custom URL from org */}
        {org.removalFormUrl && (
          <div className="mb-4 text-sm text-center">
            <a
              href={org.removalFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Additional information →
            </a>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <AnonymousRemovalForm organizationSlug={slug} />
        </div>
      </div>
    </div>
  )
}
