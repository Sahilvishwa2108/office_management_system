"use client"

import { ReactNode } from "react"
import { useUser } from "@clerk/nextjs"
import { UserRole } from "@/lib/prisma-types"
import { ROLE_HIERARCHY } from "@/lib/types"

type RoleGateProps = {
  children: ReactNode
  allowedRole: UserRole
}

export function RoleGate({ children, allowedRole }: RoleGateProps) {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded) {
    return null
  }
  
  const userRole = user?.publicMetadata?.role as UserRole | undefined
  
  if (!userRole || !(userRole in ROLE_HIERARCHY)) {
    return null
  }
  
  // Check if user has the required role or higher
  if (ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[allowedRole]) {
    return <>{children}</>
  }
  
  // User doesn't have the required role
  return null
}