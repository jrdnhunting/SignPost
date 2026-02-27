export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CompanySettingsForm } from "./company-settings-form"
import { WorkOrderPreferencesForm } from "./work-order-preferences-form"
import { ServiceAreasSection } from "./service-areas-section"
import { StaffManagementSection } from "./staff-management-section"
import { RemovalFormSettings } from "./removal-form-settings"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()

  const org = await prisma.organization.findUniqueOrThrow({
    where: { slug },
    include: {
      serviceAreas: {
        include: {
          technicians: { include: { user: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  // Fetch all non-CLIENT, non-ADMIN memberships, deduplicated by user
  const memberships = await prisma.membership.findMany({
    where: {
      organizationId: org.id,
      role: { in: ["DISPATCHER", "TECHNICIAN"] },
    },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  })

  // Group by userId to build StaffMember objects
  const staffMap = new Map<string, { userId: string; name: string; email: string; isStaff: boolean; isTechnician: boolean }>()
  for (const m of memberships) {
    const existing = staffMap.get(m.userId) ?? {
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      isStaff: false,
      isTechnician: false,
    }
    if (m.role === "DISPATCHER") existing.isStaff = true
    if (m.role === "TECHNICIAN") existing.isTechnician = true
    staffMap.set(m.userId, existing)
  }
  const staffMembers = Array.from(staffMap.values())

  // Technicians list for service area assignment
  const technicians = staffMembers
    .filter((m) => m.isTechnician)
    .map((m) => ({ id: m.userId, name: m.name }))

  // Serialize service areas (Decimal → string)
  const serviceAreas = org.serviceAreas.map((a) => ({
    id: a.id,
    name: a.name,
    polygon: a.polygon as object,
    pricingAdjustment: a.pricingAdjustment ? String(a.pricingAdjustment) : null,
    technicians: a.technicians.map((t) => ({
      userId: t.userId,
      user: { id: t.userId, name: t.user.name },
    })),
  }))

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Card 1 — Account (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Company</p>
                <p className="font-medium">{org.name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Company URL</p>
                <p className="font-mono text-gray-700">{org.slug}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Plan</p>
                <div className="flex items-center gap-2">
                  <p className="capitalize">{org.plan}</p>
                  <Button variant="outline" size="sm" disabled className="text-xs h-7">
                    Upgrade Plan
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Account Email</p>
                <div className="flex items-center gap-2">
                  <p>{session?.user?.email ?? "—"}</p>
                  <span
                    className="text-xs text-blue-500 cursor-not-allowed"
                    title="Contact support to change your email"
                  >
                    Change Email
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Company Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanySettingsForm
              orgId={org.id}
              orgSlug={slug}
              initialValues={{
                name: org.name,
                phone: org.phone,
                contactEmail: org.contactEmail,
                addressLine1: org.addressLine1,
                addressLine2: org.addressLine2,
                city: org.city,
                state: org.state,
                postalCode: org.postalCode,
                country: org.country,
              }}
            />
          </CardContent>
        </Card>

        {/* Card 3 — Work Order Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Work Order Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkOrderPreferencesForm
              orgId={org.id}
              orgSlug={slug}
              outOfServiceAreaMessage={org.outOfServiceAreaMessage}
            />
          </CardContent>
        </Card>

        {/* Card 4 — Service Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceAreasSection
              orgId={org.id}
              orgSlug={slug}
              initialAreas={serviceAreas}
              technicians={technicians}
            />
          </CardContent>
        </Card>

        {/* Card 5 — Removal Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Removal Request Form</CardTitle>
          </CardHeader>
          <CardContent>
            <RemovalFormSettings
              orgId={org.id}
              orgSlug={slug}
              initialValues={{
                removalFormText: org.removalFormText,
                removalFormUrl: org.removalFormUrl,
              }}
            />
          </CardContent>
        </Card>

        {/* Card 6 — Staff Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Staff Management</CardTitle>
          </CardHeader>
          <CardContent>
            <StaffManagementSection
              orgId={org.id}
              orgSlug={slug}
              initialMembers={staffMembers}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
