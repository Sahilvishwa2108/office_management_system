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
  | "login"
  | "logout";

export interface ActivityDetails {
  [key: string]: any;
}

/**
 * Creates an activity record in the database and maintains a limit of 20 recent activities
 */
export async function logActivity(
  type: ActivityType,
  action: ActivityAction,
  target: string,
  userId: string,
  details?: ActivityDetails
) {
  try {
    // Create the new activity record
    await prisma.activity.create({
      data: {
        type,
        action,
        target,
        userId,
        details: details ? details : undefined,
      },
    });

    // Get the current count of activities
    const totalCount = await prisma.activity.count();
    
    // If we have more than 20 activities, delete the oldest ones
    if (totalCount > 20) {
      // Calculate how many to delete
      const deleteCount = totalCount - 20;
      
      // Find the oldest activities that need to be deleted
      const oldestActivities = await prisma.activity.findMany({
        orderBy: {
          createdAt: 'asc', // Order by oldest first
        },
        take: deleteCount, // Take just the number we need to delete
        select: {
          id: true, // We only need the IDs
        },
      });
      
      // Get the IDs of activities to delete
      const idsToDelete = oldestActivities.map(activity => activity.id);
      
      // Delete the oldest activities
      if (idsToDelete.length > 0) {
        await prisma.activity.deleteMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
        });
      }
    }
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - activity logging should never break the main functionality
  }
}