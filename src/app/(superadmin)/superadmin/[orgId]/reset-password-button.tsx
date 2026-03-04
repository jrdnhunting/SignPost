"use client"

import { useState, useRef } from "react"
import { setUserPassword } from "@/actions/superadmin"

interface Props {
  userId: string
  userName: string
}

export default function ResetPasswordButton({ userId, userName }: Props) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function openForm() {
    setPassword("")
    setStatus("idle")
    setErrorMsg("")
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function close() {
    setOpen(false)
    setStatus("idle")
    setErrorMsg("")
    setPassword("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")
    const result = await setUserPassword(userId, password)
    if (result.success) {
      setStatus("success")
      setTimeout(close, 1500)
    } else {
      setStatus("error")
      setErrorMsg(result.error)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={openForm}
        className="rounded border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:border-amber-500 hover:text-amber-400 transition-colors"
      >
        Reset Password
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={close} />

          {/* Popover */}
          <div className="absolute right-0 top-7 z-50 w-72 rounded-lg border border-gray-700 bg-gray-900 shadow-xl p-4">
            <p className="text-xs font-semibold text-gray-300 mb-3">
              Set new password for <span className="text-white">{userName}</span>
            </p>

            {status === "success" ? (
              <p className="text-xs text-green-400 py-2">Password updated successfully.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {status === "error" && (
                  <p className="text-xs text-red-400">{errorMsg}</p>
                )}
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  minLength={8}
                  required
                  className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="flex-1 rounded bg-amber-600 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
                  >
                    {status === "loading" ? "Saving..." : "Set Password"}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  )
}
