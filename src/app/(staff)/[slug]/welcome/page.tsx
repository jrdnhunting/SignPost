import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function WelcomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const org = await prisma.organization.findUnique({ where: { slug } })
  if (!org) notFound()

  const workOrder = await prisma.workOrder.findFirst({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  })

  const orderId = workOrder ? String(workOrder.orderId).padStart(6, "0") : null

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Your account is ready, {org.name}!</h1>
        <p className="mt-2 text-gray-600">We created a sample order so you can explore the interface.</p>
      </div>

      {workOrder && (
        <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Order #{orderId}</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {workOrder.addressLine1}, {workOrder.city} {workOrder.state}
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {workOrder.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">{workOrder.items.length} item{workOrder.items.length !== 1 ? "s" : ""}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/${slug}/dashboard`}
          className="flex-1 text-center py-2.5 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard →
        </Link>
        {workOrder && (
          <Link
            href={`/${slug}/orders/${workOrder.id}`}
            className="flex-1 text-center py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            View Sample Order →
          </Link>
        )}
      </div>
    </div>
  )
}
