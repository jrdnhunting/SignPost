"use client"

import { useState, useTransition } from "react"
import { updateOrgBilling } from "@/actions/superadmin"

export interface BillingData {
  plan: string
  subscriptionStatus: string
  billingCycle: string
  monthlyRate: string | null
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
  billingEmail: string | null
  billingNotes: string | null
}

const STATUS_STYLES: Record<string, string> = {
  TRIALING:  "bg-blue-900/60 text-blue-300 border border-blue-700",
  ACTIVE:    "bg-green-900/60 text-green-300 border border-green-700",
  PAST_DUE:  "bg-red-900/60 text-red-300 border border-red-700",
  PAUSED:    "bg-yellow-900/60 text-yellow-300 border border-yellow-700",
  CANCELLED: "bg-gray-800 text-gray-500 border border-gray-700",
}

const PLAN_LABELS: Record<string, string> = {
  starter:    "Starter",
  pro:        "Pro",
  enterprise: "Enterprise",
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function fmtRate(rate: string | null, cycle: string) {
  if (!rate) return "—"
  const n = parseFloat(rate)
  const formatted = `$${n.toFixed(2)}/mo`
  if (cycle === "ANNUAL") return `${formatted} (billed annually)`
  return formatted
}

// ── View cell ────────────────────────────────────────────────────────────────

function Cell({
  label,
  value,
  mono = false,
  children,
}: {
  label: string
  value?: string
  mono?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      {children ?? (
        <p className={`text-sm ${mono ? "font-mono" : ""} ${!value || value === "—" ? "text-gray-600" : "text-gray-200"}`}>
          {value ?? "—"}
        </p>
      )}
    </div>
  )
}

// ── Edit field wrapper ────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  "w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"

const selectCls =
  "w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none"

// ── Main component ────────────────────────────────────────────────────────────

export default function BillingSection({ orgId, billing }: { orgId: string; billing: BillingData }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [form, setForm] = useState<BillingData>(billing)

  function set(field: keyof BillingData, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function setDate(field: "trialEndsAt" | "currentPeriodEnd", raw: string) {
    set(field, raw ? new Date(raw).toISOString() : null)
  }

  function handleEdit() {
    setForm(billing)
    setError("")
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
    setError("")
  }

  function handleSave() {
    setError("")
    startTransition(async () => {
      const result = await updateOrgBilling(orgId, form)
      if (result.success) {
        setEditing(false)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-200">Billing &amp; Subscription</h2>
        {!editing && (
          <button
            onClick={handleEdit}
            className="rounded border border-gray-700 px-3 py-1 text-xs text-gray-400 hover:border-amber-500 hover:text-amber-400 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-5 space-y-4">
          {error && (
            <p className="text-xs text-red-400 bg-red-900/30 border border-red-800 rounded px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Plan">
              <select value={form.plan} onChange={(e) => set("plan", e.target.value)} className={selectCls}>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </Field>

            <Field label="Status">
              <select value={form.subscriptionStatus} onChange={(e) => set("subscriptionStatus", e.target.value)} className={selectCls}>
                <option value="TRIALING">Trialing</option>
                <option value="ACTIVE">Active</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="PAUSED">Paused</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </Field>

            <Field label="Billing Cycle">
              <select value={form.billingCycle} onChange={(e) => set("billingCycle", e.target.value)} className={selectCls}>
                <option value="MONTHLY">Monthly</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </Field>

            <Field label="Monthly Rate ($)">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.monthlyRate ?? ""}
                onChange={(e) => set("monthlyRate", e.target.value || null)}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>

            <Field label="Trial Ends">
              <input
                type="date"
                value={form.trialEndsAt ? form.trialEndsAt.slice(0, 10) : ""}
                onChange={(e) => setDate("trialEndsAt", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Next Billing Date">
              <input
                type="date"
                value={form.currentPeriodEnd ? form.currentPeriodEnd.slice(0, 10) : ""}
                onChange={(e) => setDate("currentPeriodEnd", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Stripe Customer ID">
              <input
                type="text"
                value={form.stripeCustomerId ?? ""}
                onChange={(e) => set("stripeCustomerId", e.target.value || null)}
                placeholder="cus_…"
                className={`${inputCls} font-mono`}
              />
            </Field>

            <Field label="Billing Email">
              <input
                type="email"
                value={form.billingEmail ?? ""}
                onChange={(e) => set("billingEmail", e.target.value || null)}
                placeholder="billing@company.com"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Internal Notes">
            <textarea
              rows={3}
              value={form.billingNotes ?? ""}
              onChange={(e) => set("billingNotes", e.target.value || null)}
              placeholder="Payment history, special arrangements, account notes…"
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={handleCancel}
              className="rounded border border-gray-700 px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-800">
          {/* Row 1: plan / status / cycle / rate */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-800">
            <Cell label="Plan" value={PLAN_LABELS[billing.plan] ?? billing.plan} />
            <Cell label="Status">
              <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[billing.subscriptionStatus] ?? STATUS_STYLES.CANCELLED}`}>
                {billing.subscriptionStatus.replace("_", " ")}
              </span>
            </Cell>
            <Cell label="Billing Cycle" value={billing.billingCycle === "ANNUAL" ? "Annual" : "Monthly"} />
            <Cell label="Monthly Rate" value={fmtRate(billing.monthlyRate, billing.billingCycle)} />
          </div>

          {/* Row 2: dates / stripe / email */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-800 border-t border-gray-800">
            <Cell label="Trial Ends" value={fmtDate(billing.trialEndsAt)} />
            <Cell label="Next Billing Date" value={fmtDate(billing.currentPeriodEnd)} />
            <Cell label="Stripe Customer ID" value={billing.stripeCustomerId ?? "—"} mono />
            <Cell label="Billing Email" value={billing.billingEmail ?? "—"} />
          </div>

          {/* Row 3: notes */}
          <div className="border-t border-gray-800 px-4 py-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Internal Notes</p>
            {billing.billingNotes ? (
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{billing.billingNotes}</p>
            ) : (
              <p className="text-sm text-gray-600 italic">No notes</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
