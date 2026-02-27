"use client"
import { useState, useTransition } from "react"
import { assignTechnician } from "@/actions/assignments"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AssignTechFormProps {
  workOrderId: string
  orgSlug: string
  technicians: { id: string; name: string }[]
}

export function AssignTechForm({
  workOrderId,
  orgSlug,
  technicians,
}: AssignTechFormProps) {
  const [isPending, startTransition] = useTransition()
  const [userId, setUserId] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    startTransition(async () => {
      await assignTechnician(workOrderId, userId, undefined, orgSlug)
      setUserId("")
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end mt-3">
      <div className="flex-1 space-y-1">
        <Label>Assign Technician</Label>
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Select technician" />
          </SelectTrigger>
          <SelectContent>
            {technicians.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="sm" disabled={isPending || !userId}>
        {isPending ? "Assigning..." : "Assign"}
      </Button>
    </form>
  )
}
