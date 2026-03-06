"use server"

import { auth } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function startClientMasquerade(
  clientId: string,
  clientName: string,
  returnOrgId: string
) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    throw new Error("Unauthorized")
  }

  const cookieStore = await cookies()
  cookieStore.set("signpost-masquerade", JSON.stringify({
    clientId,
    clientName,
    returnOrgId,
    originalUserId: session.user.userId,
  }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })

  redirect(`/portal/${clientId}/orders`)
}

export async function startStaffClientMasquerade(
  clientId: string,
  clientName: string,
  returnUrl: string
) {
  const session = await auth()
  if (!session?.user || session.user.type !== "staff") {
    throw new Error("Unauthorized")
  }

  const cookieStore = await cookies()
  cookieStore.set("signpost-masquerade", JSON.stringify({
    clientId,
    clientName,
    returnUrl,
    originalUserId: (session.user as { userId?: string }).userId,
  }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })

  redirect(`/portal/${clientId}/orders`)
}

export async function stopMasquerade() {
  const cookieStore = await cookies()
  const masqRaw = cookieStore.get("signpost-masquerade")?.value
  let returnOrgId: string | null = null
  let returnUrl: string | null = null

  if (masqRaw) {
    try {
      const masq = JSON.parse(masqRaw)
      returnOrgId = masq.returnOrgId ?? null
      returnUrl = masq.returnUrl ?? null
    } catch {
      // ignore
    }
  }

  cookieStore.delete("signpost-masquerade")

  if (returnUrl) {
    redirect(returnUrl)
  } else if (returnOrgId) {
    redirect(`/superadmin/${returnOrgId}`)
  } else {
    redirect("/superadmin")
  }
}
