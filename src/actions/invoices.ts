"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function recalcInvoice(invoiceId: string) {
  const items = await prisma.invoiceLineItem.findMany({ where: { invoiceId } })
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.amount.toString()), 0)
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } })
  const taxAmount = parseFloat(inv.taxAmount.toString())
  const discountAmount = parseFloat(inv.discountAmount.toString())
  const total = subtotal + taxAmount - discountAmount
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotal, total },
  })
}

export async function createInvoice(data: {
  organizationId: string
  clientId: string
  workOrderId?: string
  invoiceNumber: string
  dueAt?: string
  notes?: string
}, orgSlug: string) {
  const invoice = await prisma.invoice.create({
    data: {
      organizationId: data.organizationId,
      clientId: data.clientId,
      workOrderId: data.workOrderId,
      invoiceNumber: data.invoiceNumber,
      dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
      notes: data.notes,
      status: "DRAFT",
    },
  })
  revalidatePath(`/${orgSlug}/invoices`)
  return serializeInvoice(invoice)
}

export async function addLineItem(invoiceId: string, data: {
  description: string
  quantity: number
  unitPrice: number
}, orgSlug: string) {
  const amount = data.quantity * data.unitPrice
  const item = await prisma.invoiceLineItem.create({
    data: {
      invoiceId,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      amount,
    },
  })
  await recalcInvoice(invoiceId)
  revalidatePath(`/${orgSlug}/invoices/${invoiceId}`)
  return serializeLineItem(item)
}

export async function removeLineItem(id: string, invoiceId: string, orgSlug: string) {
  await prisma.invoiceLineItem.delete({ where: { id } })
  await recalcInvoice(invoiceId)
  revalidatePath(`/${orgSlug}/invoices/${invoiceId}`)
}

export async function recordPayment(invoiceId: string, data: {
  amount: number
  method: string
  reference?: string
  paidAt: string
  notes?: string
}, orgSlug: string) {
  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      amount: data.amount,
      method: data.method as any,
      reference: data.reference,
      paidAt: new Date(data.paidAt),
      notes: data.notes,
    },
  })
  // Update invoice status
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { payments: true },
  })
  const totalPaid = invoice.payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
  const total = parseFloat(invoice.total.toString())
  const newStatus = totalPaid >= total ? "PAID" : "PARTIAL"
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: newStatus as any,
      paidAt: newStatus === "PAID" ? new Date() : undefined,
    },
  })
  revalidatePath(`/${orgSlug}/invoices/${invoiceId}`)
  return { ...payment, amount: String(payment.amount) }
}

export async function updateInvoiceStatus(id: string, status: string, orgSlug: string) {
  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      status: status as any,
      issuedAt: status === "SENT" ? new Date() : undefined,
    },
  })
  revalidatePath(`/${orgSlug}/invoices/${id}`)
  return serializeInvoice(invoice)
}

function serializeInvoice<T extends { subtotal: object; taxAmount: object; discountAmount: object; total: object }>(inv: T) {
  return {
    ...inv,
    subtotal: String(inv.subtotal),
    taxAmount: String(inv.taxAmount),
    discountAmount: String(inv.discountAmount),
    total: String(inv.total),
  }
}

function serializeLineItem<T extends { quantity: object; unitPrice: object; amount: object }>(item: T) {
  return {
    ...item,
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
    amount: String(item.amount),
  }
}
