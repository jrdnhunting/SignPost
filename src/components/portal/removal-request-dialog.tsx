"use client"
import { useState, useTransition } from "react"
import { createRemovalRequest } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, X } from "lucide-react"

interface RemovalRequestDialogProps {
  workOrderId: string
}

export function RemovalRequestDialog({ workOrderId }: RemovalRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [requesterName, setRequesterName] = useState("")
  const [requesterPhone, setRequesterPhone] = useState("")
  const [requesterEmail, setRequesterEmail] = useState("")
  const [preferredDate, setPreferredDate] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!requesterName.trim()) {
      setError("Name is required")
      return
    }
    setError("")
    startTransition(async () => {
      try {
        await createRemovalRequest({
          workOrderId,
          requesterName: requesterName.trim(),
          requesterPhone: requesterPhone.trim() || undefined,
          requesterEmail: requesterEmail.trim() || undefined,
          preferredDate: preferredDate || null,
          notes: notes.trim() || undefined,
        })
        setSubmitted(true)
      } catch {
        setError("Failed to submit request. Please try again.")
      }
    })
  }

  function handleClose() {
    setOpen(false)
    setSubmitted(false)
    setRequesterName("")
    setRequesterPhone("")
    setRequesterEmail("")
    setPreferredDate("")
    setNotes("")
    setError("")
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        Request Removal
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>

            {submitted ? (
              <div className="text-center py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto mb-3">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Removal Request Submitted</h3>
                <p className="text-sm text-gray-500">
                  Your removal request has been received. We will be in touch shortly.
                </p>
                <Button className="mt-4" onClick={handleClose}>
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Request Sign Removal</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Submit a request to have the sign removed. We will contact you to confirm.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rr-name">Your Name *</Label>
                  <Input
                    id="rr-name"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="Full name"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rr-phone">Phone (optional)</Label>
                  <Input
                    id="rr-phone"
                    type="tel"
                    value={requesterPhone}
                    onChange={(e) => setRequesterPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rr-email">Email (optional)</Label>
                  <Input
                    id="rr-email"
                    type="email"
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rr-date">Preferred Removal Date</Label>
                  <Input
                    id="rr-date"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rr-notes">Notes (optional)</Label>
                  <Textarea
                    id="rr-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information..."
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isPending} className="flex-1">
                    {isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
