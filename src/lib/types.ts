import { UserRole } from "@/lib/prisma-types";

/**
 * Type definition for role hierarchy.
 * Maps each user role to a numeric permission level.
 * Higher numbers indicate higher permission levels.
 */
export type RoleHierarchy = Record<UserRole, number>;

/**
 * Centralized role hierarchy mapping.
 * Used for role-based access control throughout the application.
 * 
 * Permission levels:
 * 4 = Highest (Admin)
 * 3 = High (Partner)
 * 2 = Medium (Business Executive)
 * 1 = Low (Business Consultant)
 * 0 = Lowest (Client)
 */
export const ROLE_HIERARCHY: RoleHierarchy = {
  ADMIN: 4,
  PARTNER: 3,
  BUSINESS_EXECUTIVE: 2,
  BUSINESS_CONSULTANT: 1,
  PERMANENT_CLIENT: 0,
  GUEST_CLIENT: 0
};

/**
 * Type for common API responses
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Type for pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Type for search parameters
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
}