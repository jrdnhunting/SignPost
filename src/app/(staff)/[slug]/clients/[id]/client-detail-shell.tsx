"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkOrderStatusBadge } from "@/components/staff/work-order-status-badge"
import { formatDate, formatAddress, formatOrderId } from "@/lib/utils"
import { ClientEditForm } from "./client-edit-form"
import { ClientPhotoUpload } from "./client-photo-upload"
import { PaymentMethodsCard } from "./payment-methods-card"
import { AddClientUserForm } from "./add-client-user-form"

interface WorkOrder {
  id: string
  orderId: number
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  status: string
  createdAt: Date
}

interface ClientUser {
  id: string
  name: string
  email: string
}

interface PaymentMethod {
  id: string
  type: string
  label: string
  isDefault: boolean
  notes: string | null
}

interface Client {
  id: string
  firstName: string
  lastName: string
  companyName: string | null
  email: string
  phone: string
  profilePhotoUrl: string | null
  notes: string | null
  clientNotesPublic: string | null
  clientNotesPrivate: string | null
  clientUsers: ClientUser[]
  paymentMethods: PaymentMethod[]
}

export function ClientDetailShell({
  client,
  orgSlug,
  displayName,
  workOrders,
}: {
  client: Client
  orgSlug: string
  displayName: string
  workOrders: WorkOrder[]
}) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="bg-white rounded-lg border p-6 flex flex-col sm:flex-row items-start gap-6">
        <ClientPhotoUpload
          clientId={client.id}
          orgSlug={orgSlug}
          currentPhotoUrl={client.profilePhotoUrl}
          displayName={displayName}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
              {client.companyName && (
                <p className="text-gray-500 mt-0.5">{client.companyName}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                {editing ? "Cancel" : "Edit profile"}
              </Button>
              <Button size="sm" asChild>
                <Link href={`/${orgSlug}/orders/new`}>+ New Order</Link>
              </Button>
            </div>
          </div>

          {editing ? (
            <div className="mt-4">
              <ClientEditForm client={client} orgSlug={orgSlug} onClose={() => setEditing(false)} />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <span className="text-gray-500">Email</span>
                <p className="font-medium">{client.email || "—"}</p>
              </div>
              <div>
                <span className="text-gray-500">Phone</span>
                <p className="font-medium">{client.phone || "—"}</p>
              </div>
              {client.clientNotesPublic && (
                <div className="col-span-2">
                  <span className="text-gray-500">Client Notes (Public)</span>
                  <p className="text-gray-700 mt-0.5">{client.clientNotesPublic}</p>
                </div>
              )}
              {client.clientNotesPrivate && (
                <div className="col-span-2">
                  <span className="text-gray-500">
                    Client Notes (Private) <span className="text-amber-600 text-xs">· Staff only</span>
                  </span>
                  <p className="text-gray-700 mt-0.5">{client.clientNotesPrivate}</p>
                </div>
              )}
              {client.notes && (
                <div className="col-span-2">
                  <span className="text-gray-500">Internal Notes</span>
                  <p className="text-gray-700 mt-0.5">{client.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-6">
          {/* Payment methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentMethodsCard
                clientId={client.id}
                orgSlug={orgSlug}
                initialMethods={client.paymentMethods}
              />
            </CardContent>
          </Card>

          {/* Portal logins */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Portal Logins</CardTitle>
            </CardHeader>
            <CardContent>
              {client.clientUsers.length === 0 ? (
                <p className="text-sm text-gray-500 mb-3">No portal logins.</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {client.clientUsers.map((cu) => (
                    <div key={cu.id} className="text-sm">
                      <p className="font-medium">{cu.name}</p>
                      <p className="text-gray-500">{cu.email}</p>
                    </div>
                  ))}
                </div>
              )}
              <AddClientUserForm clientId={client.id} orgSlug={orgSlug} />
            </CardContent>
          </Card>
        </div>

        {/* Work order history */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {workOrders.length === 0 ? (
                <p className="text-sm text-gray-500">No orders yet.</p>
              ) : (
                <div className="divide-y">
                  {workOrders.map((wo) => (
                    <div key={wo.id} className="py-3 flex items-center justify-between">
                      <div>
                        <Link
                          href={`/${orgSlug}/orders/${wo.id}`}
                          className="font-medium text-sm text-blue-600 hover:underline"
                        >
                          #{formatOrderId(wo.orderId)}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {formatAddress(wo)} • {formatDate(wo.createdAt)}
                        </p>
                      </div>
                      <WorkOrderStatusBadge status={wo.status as any} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
