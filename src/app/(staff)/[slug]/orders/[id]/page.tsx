export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { WorkOrderStatusBadge, WorkOrderPriorityBadge } from "@/components/staff/work-order-status-badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatDateTime, formatCurrency, formatOrderId } from "@/lib/utils"
import { AddItemForm } from "./add-item-form"
import { AssignTechForm } from "./assign-tech-form"
import { CreateInvoiceButton } from "./create-invoice-button"
import { TaskList } from "./task-list"
import { RemovalRequestDialog } from "./removal-request-dialog"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const session = await auth()
  const org = await prisma.organization.findUniqueOrThrow({ where: { slug } })

  const wo = await prisma.workOrder.findUnique({
    where: { id, organizationId: org.id },
    include: {
      client: true,
      serviceArea: true,
      items: { orderBy: { sortOrder: "asc" } },
      assignments: { include: { user: true } },
      workLogs: { include: { user: true }, orderBy: { startedAt: "desc" } },
      photos: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
      invoices: true,
      tasks: {
        include: { assignedTo: true },
        orderBy: { taskNumber: "asc" },
      },
    },
  })

  if (!wo) notFound()

  const techMemberships = await prisma.membership.findMany({
    where: { organizationId: org.id, role: "TECHNICIAN" },
    include: { user: true },
  })
  const assignedUserIds = new Set(wo.assignments.map((a) => a.userId))
  const availableTechs = techMemberships
    .filter((m) => !assignedUserIds.has(m.userId))
    .map((m) => ({ id: m.userId, name: m.user.name }))

  // All staff members for task assignment
  const staffMemberships = await prisma.membership.findMany({
    where: { organizationId: org.id, role: { in: ["ADMIN", "DISPATCHER"] } },
    include: { user: true },
  })
  const staffMembers = staffMemberships.map((m) => ({ id: m.user.id, name: m.user.name }))

  // Determine if current user can create tasks (ADMIN or DISPATCHER, not TECHNICIAN)
  const currentMembership = session?.user
    ? await prisma.membership.findFirst({
        where: {
          organizationId: org.id,
          userId: session.user.userId,
          role: { in: ["ADMIN", "DISPATCHER"] },
        },
      })
    : null
  const canCreateTasks = Boolean(currentMembership)

  const activeTasks = wo.tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED")
  const completedTasks = wo.tasks.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED")

  return (
    <div className="p-8">
      {/* Breadcrumb + Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href={`/${slug}/orders`} className="hover:text-blue-600">
            Orders
          </Link>
          <span>/</span>
          <span>#{formatOrderId(wo.orderId)}</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{formatOrderId(wo.orderId)}
            </h1>
            <p className="text-gray-500 mt-1">{wo.client.firstName} {wo.client.lastName}{wo.client.companyName ? ` · ${wo.client.companyName}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <RemovalRequestDialog workOrderId={wo.id} />
            <Button variant="outline" asChild>
              <Link href={`/${slug}/orders/${id}/edit`}>Edit</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-white rounded-lg border p-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Order ID</p>
          <p className="text-sm font-mono font-semibold">#{formatOrderId(wo.orderId)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
          <WorkOrderStatusBadge status={wo.status} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Priority</p>
          <WorkOrderPriorityBadge priority={wo.priority} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Scheduled Install</p>
          <p className="text-sm">{formatDate(wo.scheduledDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Scheduled Removal</p>
          <p className="text-sm">{formatDate(wo.scheduledRemovalDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Listing Go-Live</p>
          <p className="text-sm">{formatDate(wo.listingGoLiveDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Created</p>
          <p className="text-sm">{formatDate(wo.createdAt)}</p>
        </div>
        {wo.serviceArea && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Service Area</p>
            <p className="text-sm">{wo.serviceArea.name}</p>
            {wo.serviceAreaFee && Number(wo.serviceAreaFee) > 0 && (
              <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                +${Number(wo.serviceAreaFee).toFixed(2)} fee
              </span>
            )}
          </div>
        )}
        <div className="col-span-2">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Address</p>
          <p className="text-sm">
            {wo.addressLine1}
            {wo.addressLine2 ? `, ${wo.addressLine2}` : ""}
          </p>
          <p className="text-sm">
            {wo.city}, {wo.state} {wo.postalCode}
          </p>
          {wo.locationNotes && (
            <p className="text-xs text-gray-500 mt-1">{wo.locationNotes}</p>
          )}
        </div>
        {wo.orderNotes && (
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Order Notes</p>
            <p className="text-sm">{wo.orderNotes}</p>
          </div>
        )}
        {wo.client.clientNotesPublic && (
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Client Notes (Public)</p>
            <p className="text-sm text-gray-700">{wo.client.clientNotesPublic}</p>
          </div>
        )}
        {wo.client.clientNotesPrivate && (
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Client Notes (Private) <span className="text-amber-600 normal-case text-xs font-normal">· Staff only</span>
            </p>
            <p className="text-sm text-gray-700">{wo.client.clientNotesPrivate}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">
            Tasks ({activeTasks.length} active)
          </TabsTrigger>
          <TabsTrigger value="items">Items ({wo.items.length})</TabsTrigger>
          <TabsTrigger value="assignments">
            Assignments ({wo.assignments.length})
          </TabsTrigger>
          <TabsTrigger value="logs">Work Logs ({wo.workLogs.length})</TabsTrigger>
          <TabsTrigger value="photos">Photos ({wo.photos.length})</TabsTrigger>
          <TabsTrigger value="invoice">Invoice ({wo.invoices.length})</TabsTrigger>
        </TabsList>

        {/* Tasks */}
        <TabsContent value="tasks">
          <Card>
            <CardContent className="pt-4">
              <TaskList
                tasks={wo.tasks.map((t) => ({
                  id: t.id,
                  taskType: t.taskType,
                  taskNumber: t.taskNumber,
                  status: t.status,
                  assignedTo: t.assignedTo ? { id: t.assignedTo.id, name: t.assignedTo.name } : null,
                  preferredDate: t.preferredDate,
                  scheduledDate: t.scheduledDate,
                  notes: t.notes,
                  completedAt: t.completedAt,
                  requesterName: t.requesterName,
                  requesterPhone: t.requesterPhone,
                }))}
                workOrderId={wo.id}
                orderId={wo.orderId}
                orgSlug={slug}
                staffMembers={staffMembers}
                canCreateTasks={canCreateTasks}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items */}
        <TabsContent value="items">
          <Card>
            <CardContent className="pt-4">
              {wo.items.length > 0 ? (
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-gray-500 font-medium">
                        Description
                      </th>
                      <th className="text-right py-2 text-gray-500 font-medium">Qty</th>
                      <th className="text-right py-2 text-gray-500 font-medium">
                        Unit Price
                      </th>
                      <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {wo.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">
                          {formatCurrency(Number(item.unitPrice))}
                        </td>
                        <td className="py-2 text-right">
                          {formatCurrency(item.quantity * Number(item.unitPrice))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-sm mb-4">No items yet.</p>
              )}
              <AddItemForm workOrderId={wo.id} orgSlug={slug} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments */}
        <TabsContent value="assignments">
          <Card>
            <CardContent className="pt-4 space-y-3">
              {wo.assignments.length === 0 && (
                <p className="text-gray-500 text-sm">No technicians assigned yet.</p>
              )}
              {wo.assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="font-medium text-sm">{a.user.name}</p>
                    <p className="text-xs text-gray-500">{a.user.email}</p>
                    {a.notes && (
                      <p className="text-xs text-gray-500 mt-1">{a.notes}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      a.status === "ACCEPTED"
                        ? "bg-green-100 text-green-700"
                        : a.status === "DECLINED"
                        ? "bg-red-100 text-red-700"
                        : a.status === "COMPLETED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
              {availableTechs.length > 0 && (
                <AssignTechForm
                  workOrderId={wo.id}
                  orgSlug={slug}
                  technicians={availableTechs}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Logs */}
        <TabsContent value="logs">
          <Card>
            <CardContent className="pt-4">
              {wo.workLogs.length === 0 ? (
                <p className="text-gray-500 text-sm">No work logs yet.</p>
              ) : (
                <div className="divide-y">
                  {wo.workLogs.map((log) => {
                    const duration =
                      log.endedAt
                        ? Math.round(
                            (log.endedAt.getTime() - log.startedAt.getTime()) / 60000
                          )
                        : null
                    return (
                      <div
                        key={log.id}
                        className="py-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-sm">{log.user.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(log.startedAt)} —{" "}
                            {log.endedAt
                              ? formatDateTime(log.endedAt)
                              : "In progress"}
                          </p>
                        </div>
                        {duration !== null && (
                          <span className="text-sm text-gray-600">
                            {duration} min
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos */}
        <TabsContent value="photos">
          <Card>
            <CardContent className="pt-4">
              {wo.photos.length === 0 ? (
                <p className="text-gray-500 text-sm">No photos yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {wo.photos.map((photo) => (
                    <div key={photo.id}>
                      <img
                        src={photo.url}
                        alt={photo.caption ?? "Photo"}
                        className="w-full h-40 object-cover rounded-md border"
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {photo.uploadedBy.name}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                          {photo.context}
                        </span>
                      </div>
                      {photo.caption && (
                        <p className="text-xs text-gray-500 mt-1">{photo.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice */}
        <TabsContent value="invoice">
          <Card>
            <CardContent className="pt-4">
              {wo.invoices.length > 0 ? (
                <div className="space-y-2">
                  {wo.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <Link
                          href={`/${slug}/invoices/${inv.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                        <p className="text-xs text-gray-500">
                          Due: {formatDate(inv.dueAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(Number(inv.total))}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            inv.status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : inv.status === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-4">
                    No invoice yet for this order.
                  </p>
                  <CreateInvoiceButton
                    workOrderId={wo.id}
                    clientId={wo.clientId}
                    orgId={org.id}
                    orgSlug={slug}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
