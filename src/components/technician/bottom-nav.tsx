"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}

const navItems: NavItem[] = [
  { href: "/technician/assignments", label: "Jobs", icon: Briefcase },
  { href: "/technician", label: "Home", icon: Home, exact: true },
]

export default function BottomNav() {
  const pathname = usePathname()

  function isActive(item: NavItem) {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname === item.href || pathname.startsWith(item.href + "/")
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {navItems.map((item) => {
        const active = isActive(item)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
              active ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                active ? "text-blue-600" : "text-gray-400"
              )}
            />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
