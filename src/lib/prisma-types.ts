/**
 * Re-export types from the Prisma client for use throughout the application
 */

// Import the UserRole enum directly from the generated client
import { Prisma } from '@prisma/client'

// Re-export the UserRole enum for use in the application
export type UserRole = 'ADMIN' | 'PARTNER' | 'BUSINESS_EXECUTIVE' | 'BUSINESS_CONSULTANT' | 'PERMANENT_CLIENT' | 'GUEST_CLIENT'

// Type-safe way to verify a string is a valid UserRole
export function isUserRole(value: string): value is UserRole {
  return ['ADMIN', 'PARTNER', 'BUSINESS_EXECUTIVE', 'BUSINESS_CONSULTANT', 'PERMANENT_CLIENT', 'GUEST_CLIENT'].includes(value)
}

// Re-export other useful Prisma types as needed
export type { Prisma }