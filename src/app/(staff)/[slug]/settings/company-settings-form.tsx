"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { US_STATES } from "@/lib/constants"
import { updateOrgSettings } from "@/actions/settings"

interface Props {
  orgId: string
  orgSlug: string
  initialValues: {
    name: string
    phone: string | null
    contactEmail: string | null
    addressLine1: string | null
    addressLine2: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    country: string | null
  }
}

export function CompanySettingsForm({ orgId, orgSlug, initialValues }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(initialValues.name)
  const [phone, setPhone] = useState(initialValues.phone ?? "")
  const [contactEmail, setContactEmail] = useState(initialValues.contactEmail ?? "")
  const [addressLine1, setAddressLine1] = useState(initialValues.addressLine1 ?? "")
  const [addressLine2, setAddressLine2] = useState(initialValues.addressLine2 ?? "")
  const [city, setCity] = useState(initialValues.city ?? "")
  const [state, setState] = useState(initialValues.state ?? "")
  const [postalCode, setPostalCode] = useState(initialValues.postalCode ?? "")
  const [country, setCountry] = useState(initialValues.country ?? "US")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await updateOrgSettings(
        orgId,
        {
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          addressLine1: addressLine1.trim() || undefined,
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim() || undefined,
          state: state || undefined,
          postalCode: postalCode.trim() || undefined,
          country: country.trim() || undefined,
        },
        orgSlug
      )
      setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 col-span-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false) }}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => { setContactEmail(e.target.value); setSaved(false) }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setSaved(false) }}
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label htmlFor="addressLine1">Address Line 1</Label>
          <Input
            id="addressLine1"
            value={addressLine1}
            onChange={(e) => { setAddressLine1(e.target.value); setSaved(false) }}
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label htmlFor="addressLine2">Address Line 2</Label>
          <Input
            id="addressLine2"
            value={addressLine2}
            onChange={(e) => { setAddressLine2(e.target.value); setSaved(false) }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => { setCity(e.target.value); setSaved(false) }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="state">State</Label>
          <Select
            value={state}
            onValueChange={(val) => { setState(val); setSaved(false) }}
          >
            <SelectTrigger id="state">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="postalCode">ZIP Code</Label>
          <Input
            id="postalCode"
            value={postalCode}
            onChange={(e) => { setPostalCode(e.target.value); setSaved(false) }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => { setCountry(e.target.value); setSaved(false) }}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        {saved && <p className="text-sm text-green-600">Saved!</p>}
      </div>
    </form>
  )
}
