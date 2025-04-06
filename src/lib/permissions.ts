import { Session } from "next-auth";

// Task permissions
export const canCreateTask = (session: Session | null) => {
  return session?.user.role === "ADMIN" || session?.user.role === "PARTNER";
};

export const canEditTask = (session: Session | null, task: any) => {
  // Admin can edit any task
  if (session?.user.role === "ADMIN") return true;
  // Partner can only edit tasks they created
  if (session?.user.role === "PARTNER") return task.assignedById === session.user.id;
  return false;
};

export const canDeleteTask = (session: Session | null, task: any) => {
  // Admin can delete any task
  if (session?.user.role === "ADMIN") return true;
  // Partner can only delete tasks they created
  if (session?.user.role === "PARTNER") return task.assignedById === session.user.id;
  return false;
};

export const canReassignTask = (session: Session | null) => {
  return session?.user.role === "ADMIN" || session?.user.role === "PARTNER";
};

export const canUpdateTaskStatus = (session: Session | null) => {
  return session?.user != null; // All authenticated users can update status
};