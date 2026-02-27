import type { NextAuthConfig } from "next-auth"

// Edge-compatible auth config (no bcrypt, no Prisma)
// Used by middleware to validate JWT tokens without heavy dependencies
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.type = (user as { type?: string }).type
        token.userId = user.id
        if ((user as { clientId?: string }).clientId) {
          token.clientId = (user as { clientId: string }).clientId
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.type = token.type as string
      session.user.userId = token.userId as string
      if (token.clientId) {
        session.user.clientId = token.clientId as string
      }
      return session
    },
  },
}
