"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface PortalNavProps {
  clientName: string
  userName: string
}

export default function PortalNav({ clientName, userName }: PortalNavProps) {
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold tracking-tight text-gray-900">SignPost</span>
      </div>

      {/* Client name */}
      <div className="hidden sm:block">
        <span className="text-sm font-medium text-gray-600">{clientName}</span>
      </div>

      {/* User + sign out */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
            {initials}
          </div>
          <span className="hidden text-sm font-medium text-gray-700 sm:inline">{userName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="gap-1.5 text-gray-500 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  )
}
