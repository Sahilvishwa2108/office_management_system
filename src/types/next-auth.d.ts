import { UserRole } from "@prisma/client"
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    role: UserRole;
    avatar: string | null
    canApproveBilling?: boolean 
    roleVersion: number
  }

  interface Session {
    user: {
      id: string
      role: UserRole
      avatar: string | null
      roleVersion: number
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    avatar: string | null
    roleVersion: number
  }
}