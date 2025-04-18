import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface User {
    id: string
    role: UserRole;
    avatar: string | null
  }

  interface Session {
    user: {
      id: string
      role: UserRole
      avatar: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    avatar: string | null
  }
}