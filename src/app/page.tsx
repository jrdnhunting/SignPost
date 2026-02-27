export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function RootPage() {
  const session = await auth()

  // Redirect authenticated users to their home
  if (session?.user) {
    const userType = (session.user as { type?: string }).type
    const clientId = (session.user as { clientId?: string }).clientId
    const userId = (session.user as { userId?: string }).userId

    if (userType === "client" && clientId) {
      redirect(`/portal/${clientId}`)
    }

    if (userType === "staff" && userId) {
      const membership = await prisma.membership.findFirst({
        where: { userId },
        include: { organization: true },
        orderBy: { createdAt: "asc" },
      })
      if (membership) {
        redirect(`/${membership.organization.slug}/dashboard`)
      }
    }
  }

  // Not authenticated — show marketing landing page
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b bg-white">
        <div className="font-bold text-xl text-blue-600">SignPost</div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Staff Login
          </Link>
          <Link
            href="/portal/login"
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Client Portal
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Sign Installation, <span className="text-blue-600">Simplified</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Manage work orders, dispatch technicians, track inventory, and invoice
          clients — all in one platform built for sign installation companies.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/portal/login"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:border-gray-400 transition-colors"
          >
            Client Portal
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: "Work Order Management",
            desc: "Create, schedule, and track every sign installation job from start to finish.",
          },
          {
            title: "Technician Dispatch",
            desc: "Assign crew members, track clock-in/out, and document work with photos.",
          },
          {
            title: "Invoicing & Payments",
            desc: "Generate professional invoices and record payments with ease.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm">{feature.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
