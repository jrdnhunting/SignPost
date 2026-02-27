"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { inviteStaffMember, updateStaffRoles, removeStaffMember } from "@/actions/staff"

interface StaffMember {
  userId: string
  name: string
  email: string
  isStaff: boolean
  isTechnician: boolean
}

interface Props {
  orgId: string
  orgSlug: string
  initialMembers: StaffMember[]
}

export function StaffManagementSection({ orgId, orgSlug, initialMembers }: Props) {
  const [members, setMembers] = useState<StaffMember[]>(initialMembers)
  const [isPending, startTransition] = useTransition()

  // Invite form state
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [invitePassword, setInvitePassword] = useState("")
  const [inviteIsStaff, setInviteIsStaff] = useState(false)
  const [inviteIsTechnician, setInviteIsTechnician] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")

  function handleRoleChange(userId: string, field: "isStaff" | "isTechnician", value: boolean) {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, [field]: value } : m))
    )
    const member = members.find((m) => m.userId === userId)
    if (!member) return
    const newIsStaff = field === "isStaff" ? value : member.isStaff
    const newIsTechnician = field === "isTechnician" ? value : member.isTechnician
    startTransition(async () => {
      await updateStaffRoles(orgId, userId, newIsStaff, newIsTechnician, orgSlug)
    })
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      await removeStaffMember(orgId, userId, orgSlug)
      setMembers((prev) => prev.filter((m) => m.userId !== userId))
    })
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError("")
    setInviteSuccess("")
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePassword.trim()) {
      setInviteError("Name, email, and password are required.")
      return
    }
    if (!inviteIsStaff && !inviteIsTechnician) {
      setInviteError("Select at least one role (Staff or Technician).")
      return
    }
    startTransition(async () => {
      try {
        const user = await inviteStaffMember(
          orgId,
          {
            email: inviteEmail.trim(),
            name: inviteName.trim(),
            password: invitePassword,
            isStaff: inviteIsStaff,
            isTechnician: inviteIsTechnician,
          },
          orgSlug
        )
        setMembers((prev) => {
          // Avoid duplicates if user already existed
          if (prev.some((m) => m.userId === user.id)) {
            return prev.map((m) =>
              m.userId === user.id
                ? { ...m, isStaff: inviteIsStaff, isTechnician: inviteIsTechnician }
                : m
            )
          }
          return [
            ...prev,
            {
              userId: user.id,
              name: user.name,
              email: user.email,
              isStaff: inviteIsStaff,
              isTechnician: inviteIsTechnician,
            },
          ]
        })
        setInviteName("")
        setInviteEmail("")
        setInvitePassword("")
        setInviteIsStaff(false)
        setInviteIsTechnician(false)
        setInviteSuccess(`${user.name} has been added.`)
      } catch {
        setInviteError("Could not add member. The email may already be in use by another organization.")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Current team */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Current Team</p>
        {members.length === 0 ? (
          <p className="text-sm text-gray-500">No non-admin staff members yet.</p>
        ) : (
          <div className="border rounded-md divide-y">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={member.isStaff}
                      onChange={(e) =>
                        handleRoleChange(member.userId, "isStaff", e.target.checked)
                      }
                      disabled={isPending}
                    />
                    Staff
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={member.isTechnician}
                      onChange={(e) =>
                        handleRoleChange(member.userId, "isTechnician", e.target.checked)
                      }
                      disabled={isPending}
                    />
                    Technician
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 text-xs"
                    disabled={isPending}
                    onClick={() => handleRemove(member.userId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite new member */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Invite New Member</p>
        <form onSubmit={handleInvite} className="space-y-3 border rounded-md p-4 bg-gray-50">
          {inviteError && (
            <p className="text-xs text-red-600">{inviteError}</p>
          )}
          {inviteSuccess && (
            <p className="text-xs text-green-600">{inviteSuccess}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input
                placeholder="Jane Smith"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Temporary Password *</Label>
            <Input
              type="password"
              placeholder="Temporary password"
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={inviteIsStaff}
                onChange={(e) => setInviteIsStaff(e.target.checked)}
              />
              Staff (Dispatcher)
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={inviteIsTechnician}
                onChange={(e) => setInviteIsTechnician(e.target.checked)}
              />
              Technician
            </label>
          </div>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Adding…" : "Add Member"}
          </Button>
        </form>
      </div>
    </div>
  )
}
