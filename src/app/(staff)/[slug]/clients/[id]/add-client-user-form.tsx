"use client"
import { useState, useTransition } from "react"
import { createClientUser } from "@/actions/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddClientUserFormProps {
  clientId: string
  orgSlug: string
}

export function AddClientUserForm({ clientId, orgSlug }: AddClientUserFormProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await createClientUser({ clientId, email, name, password, phone }, orgSlug)
      setName("")
      setEmail("")
      setPassword("")
      setPhone("")
      setOpen(false)
      setSuccess(true)
    })
  }

  if (!open) {
    return (
      <div>
        {success && (
          <p className="text-sm text-green-600 mb-2">Portal login created!</p>
        )}
        <Button variant="outline" size="sm" onClick={() => { setOpen(true); setSuccess(false) }}>
          + Add Portal Login
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-md p-4 space-y-3 bg-gray-50 mt-3"
    >
      <h4 className="font-medium text-sm">Add Portal Login</h4>
      <div className="space-y-1">
        <Label htmlFor="cu-name">Name</Label>
        <Input
          id="cu-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cu-email">Email</Label>
        <Input
          id="cu-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@acme.com"
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cu-password">Password</Label>
        <Input
          id="cu-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={8}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cu-phone">Phone</Label>
        <Input
          id="cu-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 000-0000"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Creating..." : "Create Login"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
