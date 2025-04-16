import { prisma } from "@/lib/prisma";

export type ActivityType = "client" | "user" | "task" | "project" | "document" | "system";
export type ActivityAction = 
  | "created" 
  | "updated" 
  | "deleted" 
  | "assigned" 
  | "completed" 
  | "role_changed"
  | "status_changed";

export interface ActivityDetails {
  [key: string]: unknown;
}

/**
 * Creates an activity record in the database and maintains a limit of 500 recent activities
 * Login/logout activities are excluded from being stored
 */
export async function logActivity(
  type: string,
  action: string,
  target: string,
  userId: string,
  details?: Record<string, unknown>
) {
  // Skip logging login/logout activities
  if (type === "user" && (action === "login" || action === "logout")) {
    return;
  }
  
  try {
    // First verify the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      console.warn(`Skipping activity logging: User with ID ${userId} not found`);
      return; // Skip creating the activity if user doesn't exist
    }

    // Create the new activity record
    await prisma.activity.create({
      data: {
        type,
        action,
        target,
        userId,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined
      }
    });

    // Get the current count of activities
    const totalCount = await prisma.activity.count();
    
    // If we have more than 500 activities, trim the oldest ones
    if (totalCount > 500) {
      const activitiesToDelete = await prisma.activity.findMany({
        orderBy: { createdAt: 'asc' },
        take: totalCount - 500,
        select: { id: true }
      });
      
      if (activitiesToDelete.length > 0) {
        await prisma.activity.deleteMany({
          where: { id: { in: activitiesToDelete.map(a => a.id) } }
        });
      }
    }
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw the error up the chain to prevent breaking core functionality
  }
}