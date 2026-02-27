"use client"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { createInvoice } from "@/actions/invoices"
import { Button } from "@/components/ui/button"

interface CreateInvoiceButtonProps {
  workOrderId: string
  clientId: string
  orgId: string
  orgSlug: string
}

export function CreateInvoiceButton({
  workOrderId,
  clientId,
  orgId,
  orgSlug,
}: CreateInvoiceButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    startTransition(async () => {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
      const invoice = await createInvoice(
        { organizationId: orgId, clientId, workOrderId, invoiceNumber },
        orgSlug
      )
      router.push(`/${orgSlug}/invoices/${invoice.id}`)
    })
  }

  return (
    <Button onClick={handleCreate} disabled={isPending}>
      {isPending ? "Creating..." : "Create Invoice"}
    </Button>
  )
}
