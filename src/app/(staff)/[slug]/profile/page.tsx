export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileForm } from "./profile-form"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "staff") redirect("/login")

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.userId },
    select: { id: true, name: true, email: true },
  })

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <ProfileForm
        userId={user.id}
        initialName={user.name}
        initialEmail={user.email}
        orgSlug={slug}
      />
    </div>
  )
}
