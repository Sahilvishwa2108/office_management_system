import { auth } from "@clerk/nextjs/server"
import { useUser } from "@clerk/nextjs"
import { NextResponse } from "next/server"
import { UserRole } from "@/lib/prisma-types"
import { ROLE_HIERARCHY } from "@/lib/types"
import { prisma } from "@/lib/prisma"

// Get the current user's role from Clerk session
export async function getUserRole() {
  const session = await auth();
  
  if (!session.userId) {
    return null;
  }
  
  const role = (session.sessionClaims?.publicMetadata as { role?: string })?.role as UserRole | undefined;
  return role || null;
}

// Check if user has required role or higher
export async function hasRole(requiredRole: UserRole) {
  const userRole = await getUserRole();
  
  if (!userRole || !(userRole in ROLE_HIERARCHY)) {
    return false;
  }
  
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// API middleware to require a specific role
export async function requireRole(requiredRole: UserRole) {
  const hasRequiredRole = await hasRole(requiredRole);
  
  if (!hasRequiredRole) {
    return NextResponse.json(
      { error: "You don't have permission to perform this action" },
      { status: 403 }
    );
  }
  
  return null;
}

// Get the current user from the database based on Clerk ID
export async function getCurrentUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    
    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

// Client-side hook for checking role-based permissions
export function useHasPermission(requiredRole: UserRole) {
  const { user } = useUser();
  const role = user?.publicMetadata?.role as UserRole | undefined;
  
  if (!role || !(role in ROLE_HIERARCHY)) {
    return false;
  }
  
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
}