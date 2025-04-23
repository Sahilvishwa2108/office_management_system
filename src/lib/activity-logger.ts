import { prisma } from "@/lib/prisma";

export type ActivityType = "client" | "user" | "task" | "project" | "document" | "system";
export type ActivityAction = 
  | "created" 
  | "updated" 
  | "deleted" 
  | "assigned" 
  | "completed" 
  | "role_changed"
  | "status_changed"
  | "auto_deleted";  // Added for system actions

export interface ActivityDetails {
  [key: string]: unknown;
}

/**
 * Creates an activity record in the database and maintains a limit of 20 recent activities
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
      return;
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

    // Clean up old activities (limit to 20)
    await cleanupOldActivities();
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw the error up the chain to prevent breaking core functionality
  }
}

/**
 * Log activity with system as the actor
 * Used for automated actions where no user initiated the action
 */
export async function logSystemActivity(
  action: string,
  target: string,
  relatedUserId?: string,
  details?: Record<string, unknown>
) {
  try {
    // Create the activity record with system type
    await prisma.activity.create({
      data: {
        type: "system",
        action,
        target,
        // Use the related user ID if provided or use a system identifier
        userId: relatedUserId || "system",
        details: details ? JSON.parse(JSON.stringify(details)) : undefined
      }
    });
    
    // Clean up old activities (limit to 20)
    await cleanupOldActivities();
    
    return true;
  } catch (error) {
    console.error("Failed to log system activity:", error);
    // Don't throw to prevent breaking core functionality
    return false;
  }
}

/**
 * Helper function to clean up old activities
 * Maintains a maximum of 20 activities in the database
 */
async function cleanupOldActivities() {
  try {
    // Get the current count of activities
    const totalCount = await prisma.activity.count();
    
    // If we have more than 20 activities, trim the oldest ones
    if (totalCount > 20) {
      const activitiesToDelete = await prisma.activity.findMany({
        orderBy: { createdAt: 'asc' },
        take: totalCount - 20,
        select: { id: true }
      });
      
      if (activitiesToDelete.length > 0) {
        await prisma.activity.deleteMany({
          where: { id: { in: activitiesToDelete.map(a => a.id) } }
        });
      }
    }
  } catch (error) {
    console.error("Failed to clean up old activities:", error);
  }
}