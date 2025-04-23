import { Session } from "next-auth";

// Task permissions
export const canCreateTask = (session: Session | null) => {
  return session?.user.role === "ADMIN" || session?.user.role === "PARTNER";
};

export const canEditTask = (
  session: Session | null, 
  task: { 
    assignedById?: string;
    assignees?: Array<{ userId: string }>;
    [key: string]: unknown 
  }
) => {
  if (!session?.user) return false;
  
  // Admin can edit any task
  if (session.user.role === "ADMIN") return true;
  
  // Partners can only edit tasks they created
  if (session.user.role === "PARTNER") {
    return task.assignedById === session.user.id;
  }
  
  return false;
};

export const canDeleteTask = (
  session: Session | null, 
  task: { 
    assignedById?: string; 
    assignees?: Array<{ userId: string }>;
    [key: string]: unknown 
  }
) => {
  if (!session?.user) return false;
  
  // Admin can delete any task
  if (session.user.role === "ADMIN") return true;
  
  // Partner can only delete tasks they created
  if (session.user.role === "PARTNER") {
    return task.assignedById === session.user.id;
  }
  
  return false;
};

export const canViewTask = (
  session: Session | null,
  task: {
    assignedById?: string;
    assignees?: Array<{ userId: string }>;
    [key: string]: unknown
  }
) => {
  if (!session?.user) return false;
  
  // Admin can view any task
  if (session.user.role === "ADMIN") return true;
  
  // Creator can view their tasks
  if (task.assignedById === session.user.id) return true;
  
  // Check if user is in the assignees list
  if (task.assignees?.some(a => a.userId === session.user.id)) return true;
  
  return false;
};

export const canReassignTask = (session: Session | null) => {
  return session?.user.role === "ADMIN" || session?.user.role === "PARTNER";
};

export const canUpdateTaskStatus = (session: Session | null) => {
  return session?.user != null; // All authenticated users can update status
};

/**
 * Check if user has permission to modify clients (create/update/delete)
 * Only admins can modify clients
 */
export const canModifyClient = (session: Session | null): boolean => {
  return session?.user?.role === "ADMIN";
};

/**
 * Check if user can view clients
 * All staff roles can view clients
 */
export const canViewClient = (session: Session | null): boolean => {
  if (!session?.user) return false;
  
  const staffRoles = ["ADMIN", "PARTNER", "BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"];
  return staffRoles.includes(session.user.role);
};

/**
 * Format a role name for display 
 * E.g., BUSINESS_EXECUTIVE -> Business Executive
 */
export const formatRoleName = (role: string): string => {
  return role
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get access level description for a user
 */
export const getAccessLevelDescription = (session: Session | null): string => {
  if (!session?.user) return "No access";
  
  switch(session.user.role) {
    case "ADMIN":
      return "Full access - can create, view, edit and delete";
    case "PARTNER":
      return "Read-only access - can view only";
    case "BUSINESS_EXECUTIVE":
    case "BUSINESS_CONSULTANT":
      return "Read-only access - can view only";
    default:
      return "Limited access";
  }
};