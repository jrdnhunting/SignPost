"use client"

import { useState, useTransition } from "react"
import { updateClient } from "@/actions/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Client {
  id: string
  firstName: string
  lastName: string
  companyName: string | null
  email: string
  phone: string
  notes: string | null
  clientNotesPublic: string | null
  clientNotesPrivate: string | null
}

export function ClientEditForm({
  client,
  orgSlug,
  onClose,
}: {
  client: Client
  orgSlug: string
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [firstName, setFirstName] = useState(client.firstName)
  const [lastName, setLastName] = useState(client.lastName)
  const [companyName, setCompanyName] = useState(client.companyName ?? "")
  const [email, setEmail] = useState(client.email)
  const [phone, setPhone] = useState(client.phone)
  const [notes, setNotes] = useState(client.notes ?? "")
  const [clientNotesPublic, setClientNotesPublic] = useState(client.clientNotesPublic ?? "")
  const [clientNotesPrivate, setClientNotesPrivate] = useState(client.clientNotesPrivate ?? "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await updateClient(
        client.id,
        {
          firstName,
          lastName,
          companyName: companyName.trim() || null,
          email,
          phone,
          notes,
          clientNotesPublic: clientNotesPublic.trim() || null,
          clientNotesPrivate: clientNotesPrivate.trim() || null,
        },
        orgSlug
      )
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="ef-firstName">First Name *</Label>
          <Input id="ef-firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ef-lastName">Last Name *</Label>
          <Input id="ef-lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="ef-company">Company / Brokerage</Label>
        <Input id="ef-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Optional" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="ef-email">Email *</Label>
          <Input id="ef-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ef-phone">Phone *</Label>
          <Input id="ef-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="ef-notes">Internal Notes</Label>
        <Textarea id="ef-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Private staff notes (not shown to clients or technicians)" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ef-notesPublic">Client Notes (Public)</Label>
        <Textarea id="ef-notesPublic" value={clientNotesPublic} onChange={(e) => setClientNotesPublic(e.target.value)} rows={2} placeholder="Visible to client, technician, and staff on each order" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ef-notesPrivate">Client Notes (Private)</Label>
        <Textarea id="ef-notesPrivate" value={clientNotesPrivate} onChange={(e) => setClientNotesPrivate(e.target.value)} rows={2} placeholder="Visible to staff and technicians only — never shown to clients" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}
