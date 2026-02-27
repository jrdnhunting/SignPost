"use client"
import { useTransition } from "react"
import { updateInvoiceStatus } from "@/actions/invoices"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface InvoiceStatusSelectProps {
  invoiceId: string
  currentStatus: string
  orgSlug: string
}

export function InvoiceStatusSelect({
  invoiceId,
  currentStatus,
  orgSlug,
}: InvoiceStatusSelectProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <Select
      value={currentStatus}
      onValueChange={(val) => {
        startTransition(async () => {
          await updateInvoiceStatus(invoiceId, val, orgSlug)
        })
      }}
      disabled={isPending}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="DRAFT">Draft</SelectItem>
        <SelectItem value="SENT">Sent</SelectItem>
        <SelectItem value="PARTIAL">Partial</SelectItem>
        <SelectItem value="PAID">Paid</SelectItem>
        <SelectItem value="VOID">Void</SelectItem>
      </SelectContent>
    </Select>
  )
}
