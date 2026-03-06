"use client"
import { useState, useTransition } from "react"
import { updateClientUserProfile, changeClientUserPassword, updateClientAccount } from "@/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X } from "lucide-react"

interface ClientProfileFormProps {
  userId: string | null
  initialName: string
  initialEmail: string
  clientId: string
  initialCompanyName: string
  initialPhone: string
  initialNotificationEmails: string[]
  isMasquerade?: boolean
}

export function ClientProfileForm({
  userId,
  initialName,
  initialEmail,
  clientId,
  initialCompanyName,
  initialPhone,
  initialNotificationEmails,
  isMasquerade = false,
}: ClientProfileFormProps) {
  const [isPending, startTransition] = useTransition()

  // Account login info
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Company info
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [phone, setPhone] = useState(initialPhone)
  const [notificationEmails, setNotificationEmails] = useState<string[]>(initialNotificationEmails)
  const [newEmail, setNewEmail] = useState("")
  const [companyMsg, setCompanyMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Password
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg(null)
    startTransition(async () => {
      try {
        await updateClientUserProfile({ userId: userId!, name, email }, clientId)
        setProfileMsg({ type: "success", text: "Profile updated." })
      } catch (err) {
        setProfileMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to save." })
      }
    })
  }

  function handleCompanySave(e: React.FormEvent) {
    e.preventDefault()
    setCompanyMsg(null)
    startTransition(async () => {
      try {
        await updateClientAccount({ clientId, companyName, phone, notificationEmails })
        setCompanyMsg({ type: "success", text: "Company info updated." })
      } catch (err) {
        setCompanyMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to save." })
      }
    })
  }

  function handleAddNotificationEmail() {
    const trimmed = newEmail.trim()
    if (!trimmed || notificationEmails.includes(trimmed)) return
    setNotificationEmails([...notificationEmails, trimmed])
    setNewEmail("")
  }

  function handleRemoveNotificationEmail(addr: string) {
    setNotificationEmails(notificationEmails.filter((e) => e !== addr))
  }

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMsg(null)
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." })
      return
    }
    startTransition(async () => {
      try {
        await changeClientUserPassword({ userId: userId!, currentPassword, newPassword })
        setPasswordMsg({ type: "success", text: "Password changed." })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } catch (err) {
        setPasswordMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to change password." })
      }
    })
  }

  return (
    <div className="space-y-6">
      {isMasquerade && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You are viewing this page as a staff masquerade. Personal login info and password are read-only.
        </div>
      )}

      {/* Login info */}
      {isMasquerade ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase mb-0.5">Name</p>
              <p className="font-medium">{initialName || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase mb-0.5">Email</p>
              <p className="font-medium">{initialEmail || "—"}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {profileMsg && (
              <p className={`text-sm ${profileMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {profileMsg.text}
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Company info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCompanySave} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="company-phone">Phone</Label>
              <Input
                id="company-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Notification Email Addresses</Label>
              <p className="text-xs text-gray-500">
                These addresses will receive order update notifications in addition to your account email.
              </p>
              {notificationEmails.length > 0 && (
                <ul className="space-y-1">
                  {notificationEmails.map((addr) => (
                    <li key={addr} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 bg-gray-50 border rounded px-2 py-1">{addr}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNotificationEmail(addr)}
                        className="text-gray-400 hover:text-red-500"
                        aria-label={`Remove ${addr}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleAddNotificationEmail() }
                  }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddNotificationEmail}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {companyMsg && (
              <p className={`text-sm ${companyMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {companyMsg.text}
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Company Info"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password — hidden when masquerading */}
      {!isMasquerade && <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="current-pw">Current Password</Label>
              <Input
                id="current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-pw">New Password</Label>
              <Input
                id="new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-pw">Confirm New Password</Label>
              <Input
                id="confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {passwordMsg && (
              <p className={`text-sm ${passwordMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {passwordMsg.text}
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>}
    </div>
  )
}
