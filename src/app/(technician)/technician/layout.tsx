export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import BottomNav from "@/components/technician/bottom-nav"

export default async function TechnicianLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || session.user.type !== "staff") {
    redirect("/login")
  }

  // Verify TECHNICIAN role in at least one org
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.userId, role: "TECHNICIAN" },
  })

  if (!membership) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-blue-600">SignPost</span>
        <span className="text-sm text-gray-500">{session.user.name}</span>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  )
}
