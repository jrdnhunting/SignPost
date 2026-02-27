import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "staff",
      name: "Staff Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) return null
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          type: "staff" as const,
        }
      },
    }),
    Credentials({
      id: "client",
      name: "Client Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const clientUser = await prisma.clientUser.findUnique({
          where: { email: credentials.email as string },
        })
        if (!clientUser) return null
        const valid = await bcrypt.compare(
          credentials.password as string,
          clientUser.passwordHash
        )
        if (!valid) return null
        return {
          id: clientUser.id,
          email: clientUser.email,
          name: clientUser.name,
          clientId: clientUser.clientId,
          type: "client" as const,
        }
      },
    }),
  ],
})

declare module "next-auth" {
  interface Session {
    user: {
      type: string
      userId: string
      clientId?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
