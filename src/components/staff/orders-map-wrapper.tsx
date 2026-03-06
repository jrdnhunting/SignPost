"use client"

import dynamic from "next/dynamic"
import type { MapWorkOrder } from "@/components/staff/orders-map"

const OrdersMap = dynamic(
  () => import("@/components/staff/orders-map").then((m) => m.OrdersMap),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-96 text-gray-400 text-sm">Loading map…</div> }
)

interface Props {
  slug: string
  orders: MapWorkOrder[]
}

export function OrdersMapWrapper({ slug, orders }: Props) {
  return <OrdersMap slug={slug} orders={orders} />
}
