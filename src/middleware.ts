import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"
import type { NextAuthRequest } from "next-auth"

// Use edge-compatible auth (no bcrypt/Prisma) just for JWT validation
const { auth } = NextAuth(authConfig)

export default auth(function middleware(req: NextAuthRequest) {
  const session = req.auth
  const pathname = req.nextUrl.pathname

  // Already auth'd → skip login pages
  if (pathname === "/login" || pathname === "/portal/login") {
    if (session?.user) {
      const userType = (session.user as { type?: string }).type
      const clientId = (session.user as { clientId?: string }).clientId
      if (userType === "staff") {
        return NextResponse.redirect(new URL("/", req.url))
      }
      if (userType === "client" && clientId) {
        return NextResponse.redirect(new URL(`/portal/${clientId}`, req.url))
      }
    }
    return NextResponse.next()
  }

  // Technician routes — must be staff
  if (pathname.startsWith("/technician")) {
    const userType = (session?.user as { type?: string } | undefined)?.type
    if (!session?.user || userType !== "staff") {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    return NextResponse.next()
  }

  // Super admin routes — must be staff + isSuperAdmin
  if (pathname.startsWith("/superadmin")) {
    const userType = (session?.user as { type?: string } | undefined)?.type
    const isSuperAdmin = (session?.user as { isSuperAdmin?: boolean } | undefined)?.isSuperAdmin
    if (!session?.user || userType !== "staff" || !isSuperAdmin) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    return NextResponse.next()
  }

  // Portal routes — client session with matching clientId, OR super admin masquerade
  const portalMatch = pathname.match(/^\/portal\/([^/]+)/)
  if (portalMatch) {
    const clientId = portalMatch[1]
    const userType = (session?.user as { type?: string } | undefined)?.type
    const isSuperAdmin = (session?.user as { isSuperAdmin?: boolean } | undefined)?.isSuperAdmin

    // Any staff member with a matching masquerade cookie can access the portal
    if (userType === "staff") {
      const masqCookie = req.cookies.get("signpost-masquerade")?.value
      if (masqCookie) {
        try {
          const masq = JSON.parse(masqCookie)
          if (masq.clientId === clientId) {
            return NextResponse.next()
          }
        } catch {
          // Invalid cookie — fall through to normal check
        }
      }
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const sessionClientId = (session?.user as { clientId?: string } | undefined)?.clientId
    if (!session?.user || userType !== "client" || sessionClientId !== clientId) {
      return NextResponse.redirect(new URL("/portal/login", req.url))
    }
    return NextResponse.next()
  }

  // Staff org routes — first segment is an org slug
  const topLevelRoutes = ["api", "login", "portal", "technician", "superadmin", "signup", "qr", "_next", "favicon.ico"]
  const firstSegment = pathname.split("/")[1]
  if (firstSegment && !topLevelRoutes.includes(firstSegment)) {
    const userType = (session?.user as { type?: string } | undefined)?.type
    if (!session?.user || userType !== "staff") {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
