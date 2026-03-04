export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Sidebar from "@/components/staff/sidebar"

export default async function StaffLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()

  if (!session?.user || session.user.type !== "staff") {
    redirect("/login")
  }

  const org = await prisma.organization.findUnique({ where: { slug } })
  if (!org) redirect("/")

  // Super admin bypasses membership check
  if (session.user.isSuperAdmin) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.userId } })
    return (
      <div className="flex min-h-screen">
        <Sidebar
          orgSlug={slug}
          userName={user.name}
          userEmail={user.email}
          isSuperAdmin
        />
        <main className="flex-1 ml-60 bg-gray-50 min-h-screen">
          {children}
        </main>
      </div>
    )
  }

  const membership = await prisma.membership.findFirst({
    where: {
      organizationId: org.id,
      userId: session.user.userId,
    },
    include: { user: true },
  })

  if (!membership) redirect("/")

  return (
    <div className="flex min-h-screen">
      <Sidebar
        orgSlug={slug}
        userName={membership.user.name}
        userEmail={membership.user.email}
      />
      <main className="flex-1 ml-60 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  )
}
