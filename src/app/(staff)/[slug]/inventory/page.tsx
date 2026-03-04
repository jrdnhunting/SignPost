export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { AddItemForm } from "./add-item-form"
import { AdjustStockForm } from "./adjust-stock-form"
import { ClientAssetsSection } from "./client-assets-section"
import { InventoryTabs } from "./inventory-tabs"

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const org = await prisma.organization.findUniqueOrThrow({ where: { slug } })

  const [items, clientAssets, clients, techMemberships, activeWorkOrders] = await Promise.all([
    prisma.inventoryItemType.findMany({
      where: { organizationId: org.id },
      orderBy: { name: "asc" },
    }),
    prisma.clientAsset.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        locationWorkOrder: {
          select: { id: true, orderId: true, addressLine1: true, addressLine2: true, city: true, state: true, postalCode: true },
        },
        locationUser: { select: { id: true, name: true } },
      },
    }),
    prisma.client.findMany({
      where: { organizationId: org.id },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, companyName: true },
    }),
    prisma.membership.findMany({
      where: { organizationId: org.id, role: "TECHNICIAN" },
      select: { user: { select: { id: true, name: true } } },
    }),
    prisma.workOrder.findMany({
      where: {
        organizationId: org.id,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      orderBy: { orderId: "desc" },
      select: { id: true, orderId: true, addressLine1: true, addressLine2: true, city: true, state: true, postalCode: true },
    }),
  ])

  const technicians = techMemberships.map((m) => m.user)

  const stockTab = (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <AdjustStockForm
            orgSlug={slug}
            items={items.map((i) => ({ id: i.id, name: i.name }))}
          />
          <AddItemForm organizationId={org.id} orgSlug={slug} />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">No inventory items yet.</p>
          <AddItemForm organizationId={org.id} orgSlug={slug} />
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Unit</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">In Stock</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Reorder At</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => {
                const lowStock =
                  item.reorderPoint !== null &&
                  item.currentStock <= item.reorderPoint
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">{item.sku ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 text-right font-medium">{item.currentStock}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {item.reorderPoint ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {lowStock ? (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const clientAssetsTab = (
    <ClientAssetsSection
      organizationId={org.id}
      orgSlug={slug}
      assets={clientAssets}
      clients={clients}
      technicians={technicians}
      activeWorkOrders={activeWorkOrders}
    />
  )

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventory</h1>
      <InventoryTabs stockTab={stockTab} clientAssetsTab={clientAssetsTab} />
    </div>
  )
}
