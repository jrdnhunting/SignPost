"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from "@/actions/email-templates"
import { Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react"

interface EmailTemplate {
  id: string
  organizationId: string
  name: string
  subject: string
  body: string
  triggerDays: number
  isActive: boolean
}

interface Props {
  orgId: string
  orgSlug: string
  initialTemplates: EmailTemplate[]
}

const VARIABLE_HINT = "Available variables: {{client_name}}, {{order_id}}, {{address}}, {{installed_date}}, {{org_name}}"

export function EmailAutomationSection({ orgId, orgSlug, initialTemplates }: Props) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates)
  const [isPending, startTransition] = useTransition()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Add form state
  const [addName, setAddName] = useState("")
  const [addSubject, setAddSubject] = useState("")
  const [addBody, setAddBody] = useState("")
  const [addDays, setAddDays] = useState("30")

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editSubject, setEditSubject] = useState("")
  const [editBody, setEditBody] = useState("")
  const [editDays, setEditDays] = useState("30")

  function startEdit(t: EmailTemplate) {
    setEditingId(t.id)
    setEditName(t.name)
    setEditSubject(t.subject)
    setEditBody(t.body)
    setEditDays(String(t.triggerDays))
  }

  function handleAdd() {
    if (!addName.trim() || !addSubject.trim() || !addBody.trim()) return
    startTransition(async () => {
      const t = await createEmailTemplate(
        { organizationId: orgId, name: addName.trim(), subject: addSubject.trim(), body: addBody.trim(), triggerDays: parseInt(addDays) || 30 },
        orgSlug
      )
      setTemplates((prev) => [...prev, t])
      setAddName(""); setAddSubject(""); setAddBody(""); setAddDays("30")
      setShowAddForm(false)
    })
  }

  function handleSaveEdit(id: string) {
    startTransition(async () => {
      const t = await updateEmailTemplate(
        id,
        { name: editName.trim(), subject: editSubject.trim(), body: editBody.trim(), triggerDays: parseInt(editDays) || 30 },
        orgSlug
      )
      setTemplates((prev) => prev.map((item) => item.id === id ? t : item))
      setEditingId(null)
    })
  }

  function handleToggleActive(t: EmailTemplate) {
    startTransition(async () => {
      const updated = await updateEmailTemplate(t.id, { isActive: !t.isActive }, orgSlug)
      setTemplates((prev) => prev.map((item) => item.id === t.id ? updated : item))
    })
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this email template?")) return
    startTransition(async () => {
      await deleteEmailTemplate(id, orgSlug)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Automatically send emails to clients based on how many days their sign has been in the ground.
      </p>

      {templates.length === 0 && !showAddForm && (
        <p className="text-xs text-gray-400 text-center py-3 border border-dashed rounded-md">
          No templates yet
        </p>
      )}

      <div className="space-y-2">
        {templates.map((t) =>
          editingId === t.id ? (
            <div key={t.id} className="border rounded-md p-3 bg-blue-50 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Template Name</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 text-sm" autoFocus />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Trigger (days after installation)</Label>
                  <Input type="number" min={1} value={editDays} onChange={(e) => setEditDays(e.target.value)} className="h-7 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Subject Line</Label>
                <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="h-7 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Body</Label>
                <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4} className="text-sm" />
                <p className="text-xs text-gray-400">{VARIABLE_HINT}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSaveEdit(t.id)} disabled={isPending}>
                  <Check className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div key={t.id} className={`border rounded-md p-3 ${t.isActive ? "bg-white" : "bg-gray-50 opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500 truncate">{t.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Triggers {t.triggerDays} day{t.triggerDays !== 1 ? "s" : ""} after installation</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(t)}
                    disabled={isPending}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {t.isActive ? "Active" : "Inactive"}
                  </button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(t)}>
                    <Pencil className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(t.id)} disabled={isPending}>
                    <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {showAddForm && (
        <div className="border rounded-md p-3 bg-blue-50 space-y-2">
          <p className="text-xs font-semibold text-gray-700">New template</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Template Name *</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. 30-day check-in" className="h-7 text-sm" autoFocus />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Trigger (days after installation) *</Label>
              <Input type="number" min={1} value={addDays} onChange={(e) => setAddDays(e.target.value)} className="h-7 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subject Line *</Label>
            <Input value={addSubject} onChange={(e) => setAddSubject(e.target.value)} placeholder="Your sign has been installed for {{triggerDays}} days" className="h-7 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Body *</Label>
            <Textarea value={addBody} onChange={(e) => setAddBody(e.target.value)} placeholder="Hi {{client_name}}, ..." rows={4} className="text-sm" />
            <p className="text-xs text-gray-400">{VARIABLE_HINT}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={isPending || !addName.trim() || !addSubject.trim() || !addBody.trim()}>
              <Check className="h-3.5 w-3.5 mr-1" /> Add template
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setAddName(""); setAddSubject(""); setAddBody(""); setAddDays("30") }}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {!showAddForm && (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
          + Add template
        </Button>
      )}
    </div>
  )
}
