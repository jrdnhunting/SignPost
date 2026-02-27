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
