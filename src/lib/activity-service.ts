import { prisma } from "@/lib/prisma";
import { processActivityNotifications } from "@/lib/notification-service";
import { Activity } from "@prisma/client";

interface ActivityData {
  type: "user" | "task" | "client" | "document" | "message";
  action: string;
  target: string;
  details?: any;
  userId: string; // User who performed the action
  relatedUserIds?: string[]; // Users who should be notified
}

/**
 * Creates an activity log and triggers notifications
 * Login/logout activities are excluded from being stored
 */
export async function logActivity({
  type,
  action,
  target,
  details,
  userId,
  relatedUserIds = []
}: ActivityData): Promise<Activity | null> {  // Changed return type to allow null when skipping
  // Skip logging login/logout activities
  if (type === "user" && (action === "login" || action === "logout")) {
    return null;
  }
  
  try {
    // Create the activity record
    const activity = await prisma.activity.create({
      data: {
        type,
        action,
        target,
        details: details || {},
        userId
      }
    });
    
    // Process notifications based on this activity
    await processActivityNotifications({
      activityId: activity.id,
      type,
      action,
      target,
      details,
      actorId: userId,
      relatedUserIds
    });
    
    return activity;
  } catch (error) {
    console.error("Failed to log activity:", error);
    throw error; // Rethrow as activity logging is likely important for the application
  }
}