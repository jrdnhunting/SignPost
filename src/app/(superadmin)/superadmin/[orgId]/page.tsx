export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import MasqueradeButton from "./masquerade-button"
import ResetPasswordButton from "./reset-password-button"
import BillingSection from "./billing-section"

export default async function SuperAdminOrgPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      memberships: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
      clients: {
        include: {
          _count: { select: { clientUsers: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
    },
  })

  if (!org) notFound()

  // Serialize Decimal/Date fields for client component boundary
  const billing = {
    plan: org.plan,
    subscriptionStatus: org.subscriptionStatus,
    billingCycle: org.billingCycle,
    monthlyRate: org.monthlyRate != null ? String(org.monthlyRate) : null,
    trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
    currentPeriodEnd: org.currentPeriodEnd?.toISOString() ?? null,
    stripeCustomerId: org.stripeCustomerId ?? null,
    billingEmail: org.billingEmail ?? null,
    billingNotes: org.billingNotes ?? null,
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/superadmin" className="text-gray-400 hover:text-white text-sm">
          ← All Orgs
        </Link>
        <h1 className="text-2xl font-bold text-white">{org.name}</h1>
        <code className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">{org.slug}</code>
        <Link
          href={`/${org.slug}/dashboard`}
          className="rounded border border-gray-700 px-3 py-1 text-xs text-gray-400 hover:text-white"
        >
          Open Staff Dashboard →
        </Link>
      </div>

      {/* Billing section */}
      <BillingSection orgId={org.id} billing={billing} />

      {/* Staff section */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-200">Staff</h2>
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Roles</th>
                <th className="px-4 py-3 text-left">Flags</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {org.memberships.map((m) => (
                <tr key={m.id} className="bg-gray-900 hover:bg-gray-800/60">
                  <td className="px-4 py-3 font-medium text-white">{m.user.name}</td>
                  <td className="px-4 py-3 text-gray-400">{m.user.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {m.user.isSuperAdmin && (
                      <span className="rounded bg-amber-700 px-2 py-0.5 text-xs font-semibold text-amber-200">
                        SUPER ADMIN
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ResetPasswordButton userId={m.user.id} userName={m.user.name ?? m.user.email} />
                  </td>
                </tr>
              ))}
              {org.memberships.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No staff members</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Clients section */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-200">Clients</h2>
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-right">Portal Users</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {org.clients.map((client) => {
                const clientName = client.companyName ?? `${client.firstName} ${client.lastName}`
                return (
                  <tr key={client.id} className="bg-gray-900 hover:bg-gray-800/60">
                    <td className="px-4 py-3 font-medium text-white">{clientName}</td>
                    <td className="px-4 py-3 text-gray-400">{client.email}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{client._count.clientUsers}</td>
                    <td className="px-4 py-3 text-right">
                      <MasqueradeButton
                        clientId={client.id}
                        clientName={clientName}
                        orgId={org.id}
                      />
                    </td>
                  </tr>
                )
              })}
              {org.clients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No clients</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
