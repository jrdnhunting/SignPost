import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d)
}

export function formatOrderId(orderId: number): string {
  return orderId.toString().padStart(6, "0")
}

export function formatClientName(client: {
  firstName: string
  lastName: string
  companyName?: string | null
}): string {
  const name = `${client.firstName} ${client.lastName}`.trim()
  if (client.companyName) return `${name} (${client.companyName})`
  return name || "—"
}

export function formatAddress(wo: {
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  postalCode: string
}): string {
  const line1 = wo.addressLine2
    ? `${wo.addressLine1}, ${wo.addressLine2}`
    : wo.addressLine1
  return `${line1}, ${wo.city}, ${wo.state} ${wo.postalCode}`
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function formatAssetCategory(cat: string): string {
  const labels: Record<string, string> = {
    SIGN_PANEL: "Sign Panel",
    SIGN_RIDER: "Sign Rider",
    INFO_BOX:   "Info Box",
    YARD_SIGN:  "Yard Sign",
  }
  return labels[cat] ?? cat
}

/** Derive a payment status label from a work order's invoices. */
export function derivePaymentStatus(invoices: { status: string }[]): string {
  if (!invoices.length) return "No Invoice"
  const statuses = invoices.map((i) => i.status)
  if (statuses.every((s) => s === "PAID")) return "Paid"
  if (statuses.some((s) => s === "OVERDUE")) return "Overdue"
  if (statuses.some((s) => s === "PARTIAL")) return "Partial"
  if (statuses.some((s) => s === "SENT")) return "Sent"
  return "Pending"
}
