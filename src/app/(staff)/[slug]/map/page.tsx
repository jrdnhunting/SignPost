export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { geocodeAddress } from "@/lib/geocode"
import { MapFilterBar } from "@/components/staff/map-filter-bar"
import { OrdersMapWrapper } from "@/components/staff/orders-map-wrapper"
import { formatClientName } from "@/lib/utils"
import type { MapWorkOrder } from "@/components/staff/orders-map"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ status?: string; clientId?: string; serviceAreaId?: string }>
}

export default async function MapPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { status, clientId, serviceAreaId } = await searchParams

  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!org) notFound()

  const where: Record<string, unknown> = {
    organizationId: org.id,
    archivedAt: null,
  }
  if (status) where.status = status
  if (clientId) where.clientId = clientId
  if (serviceAreaId) where.serviceAreaId = serviceAreaId

  const [rawOrders, clients, serviceAreas] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        serviceArea: { select: { id: true, name: true } },
        assignments: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      where: { organizationId: org.id },
      select: { id: true, firstName: true, lastName: true, companyName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.serviceArea.findMany({
      where: { organizationId: org.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  // Backfill geocoding: up to 20 orders missing coords
  const needsGeo = rawOrders.filter((o) => o.lat === null || o.lng === null).slice(0, 20)
  for (const wo of needsGeo) {
    const point = await geocodeAddress({
      addressLine1: wo.addressLine1,
      addressLine2: wo.addressLine2,
      city: wo.city,
      state: wo.state,
      postalCode: wo.postalCode,
      country: wo.country,
    })
    if (point) {
      await prisma.workOrder.update({ where: { id: wo.id }, data: { lat: point.lat, lng: point.lng } })
      wo.lat = point.lat
      wo.lng = point.lng
    }
  }

  // Serialize for client component (Decimal → string, Date → ISO string)
  const orders: MapWorkOrder[] = rawOrders.map((wo) => ({
    id: wo.id,
    orderId: wo.orderId,
    status: wo.status,
    lat: wo.lat,
    lng: wo.lng,
    addressLine1: wo.addressLine1,
    addressLine2: wo.addressLine2 ?? null,
    city: wo.city,
    state: wo.state,
    postalCode: wo.postalCode,
    scheduledDate: wo.scheduledDate ? wo.scheduledDate.toISOString() : null,
    installedAt: wo.installedAt ? wo.installedAt.toISOString() : null,
    scheduledRemovalDate: wo.scheduledRemovalDate ? wo.scheduledRemovalDate.toISOString() : null,
    client: {
      firstName: wo.client.firstName,
      lastName: wo.client.lastName,
      companyName: wo.client.companyName ?? null,
    },
    assignments: wo.assignments.map((a) => ({
      status: a.status,
      user: { id: a.user.id, name: a.user.name },
    })),
  }))

  const clientOptions = clients.map((c) => ({
    id: c.id,
    label: formatClientName(c),
  }))

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Map</h1>
        <span className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
      </div>

      <MapFilterBar
        slug={slug}
        clients={clientOptions}
        serviceAreas={serviceAreas}
      />

      <OrdersMapWrapper slug={slug} orders={orders} />
    </div>
  )
}
