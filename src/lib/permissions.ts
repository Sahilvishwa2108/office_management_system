import { Session } from "next-auth";

// Task permissions
export const canCreateTask = (session: Session | null) => {
  return session?.user.role === "ADMIN";
};

export const canEditTask = (session: Session | null) => {
  return session?.user.role === "ADMIN";
};

export const canDeleteTask = (session: Session | null) => {
  return session?.user.role === "ADMIN";
};

export const canReassignTask = (session: Session | null) => {
  return session?.user.role === "ADMIN" || session?.user.role === "PARTNER";
};

export const canUpdateTaskStatus = (session: Session | null) => {
  return session?.user != null; // All authenticated users can update status
};