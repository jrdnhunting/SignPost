"use client"
import { useState, useTransition } from "react"
import { submitAnonymousRemovalRequest } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AddressAutocomplete, type AddressFields } from "@/components/address-autocomplete"

const EMPTY_ADDRESS: AddressFields = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
}

interface AnonymousRemovalFormProps {
  organizationSlug: string
}

export default function AnonymousRemovalForm({ organizationSlug }: AnonymousRemovalFormProps) {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const [agentName, setAgentName] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [preferredDate, setPreferredDate] = useState("")
  const [notes, setNotes] = useState("")
  const [address, setAddress] = useState<AddressFields>(EMPTY_ADDRESS)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!agentName.trim()) {
      setError("Agent name is required")
      return
    }
    if (!address.addressLine1 || !address.city || !address.state || !address.postalCode) {
      setError("Please enter a complete address")
      return
    }

    startTransition(async () => {
      try {
        await submitAnonymousRemovalRequest({
          organizationSlug,
          agentName: agentName.trim(),
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || undefined,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          preferredDate: preferredDate || null,
          notes: notes.trim() || undefined,
        })
        setSubmitted(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred"
        if (message.includes("No active installation")) {
          setError("No active sign installation found at this address. Please verify the address and try again.")
        } else {
          setError("Failed to submit request. Please try again.")
        }
      }
    })
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
          <span className="text-green-600 text-2xl">✓</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted</h2>
        <p className="text-gray-500">
          Your removal request has been received. We will be in touch to schedule the removal.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="font-semibold text-gray-900 mb-1">Sign Address</h2>
        <p className="text-sm text-gray-500 mb-3">Enter the address where the sign is installed.</p>
        <AddressAutocomplete
          value={address}
          onChange={setAddress}
          onGeoPoint={() => {}}
        />
      </div>

      <div className="border-t pt-4">
        <h2 className="font-semibold text-gray-900 mb-3">Your Information</h2>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="agent-name">Agent Name *</Label>
            <Input
              id="agent-name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="The real estate agent requesting removal"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="contact-name">Contact Name (optional)</Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name of contact person if different"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="contact-phone">Phone (optional)</Label>
            <Input
              id="contact-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 000-0000"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="preferred-date">Preferred Removal Date (optional)</Label>
            <Input
              id="preferred-date"
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Access instructions, special requests, etc."
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Submitting..." : "Submit Removal Request"}
      </Button>
    </form>
  )
}
