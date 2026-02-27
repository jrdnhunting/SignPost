"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  FileText,
  Settings,
  LogOut,
  CheckSquare,
  UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  orgSlug: string
  userName: string
  userEmail: string
}

interface NavLink {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export default function Sidebar({ orgSlug, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()

  const navLinks: NavLink[] = [
    { href: `/${orgSlug}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/${orgSlug}/orders`, label: "Orders", icon: ClipboardList },
    { href: `/${orgSlug}/tasks`, label: "Tasks", icon: CheckSquare },
    { href: `/${orgSlug}/clients`, label: "Clients", icon: Users },
    { href: `/${orgSlug}/inventory`, label: "Inventory", icon: Package },
    { href: `/${orgSlug}/invoices`, label: "Invoices", icon: FileText },
    { href: `/${orgSlug}/settings`, label: "Settings", icon: Settings },
  ]

  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-60 flex-col bg-gray-900 text-white">
      {/* Brand / Org Slug */}
      <div className="flex h-16 items-center border-b border-gray-800 px-5">
        <Link
          href={`/${orgSlug}/dashboard`}
          className="text-lg font-bold tracking-tight text-white hover:text-gray-200"
        >
          SignPost
        </Link>
        <span className="ml-2 rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-300">
          {orgSlug}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-800 px-3 py-4">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-600 text-xs font-semibold text-white">
            {initials}
          </div>
          <Link
            href={`/${orgSlug}/profile`}
            className="min-w-0 flex-1 group"
          >
            <p className="truncate text-sm font-medium text-white group-hover:text-gray-300">{userName}</p>
            <p className="truncate text-xs text-gray-400 group-hover:text-gray-500">{userEmail}</p>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-gray-400 hover:bg-gray-800 hover:text-white"
            onClick={() => signOut()}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
