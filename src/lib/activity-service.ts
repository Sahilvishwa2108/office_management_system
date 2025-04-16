import { prisma } from "@/lib/prisma";
import { Activity, Prisma } from "@prisma/client";

interface ActivityData {
  type: "user" | "task" | "client" | "document" | "message" | "system";
  action: string;
  target: string;
  details?: Record<string, unknown>;
  userId: string; // User who performed the action
  relatedUserIds?: string[]; // Users who should be notified
}

/**
 * Unified activity logging service
 * Creates an activity log and can trigger notifications
 * Login/logout activities are excluded from being stored
 */
export async function logActivity({
  type,
  action,
  target,
  details,
  userId,
  relatedUserIds = []
}: ActivityData): Promise<Activity | null> {
  // Skip logging login/logout activities
  if (type === "user" && (action === "login" || action === "logout")) {
    return null;
  }
  
  try {
    // Verify the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      console.warn(`Skipping activity logging: User with ID ${userId} not found`);
      return null;
    }
    
    // Create the activity record
    const activity = await prisma.activity.create({
      data: {
        type,
        action,
        target,
        details: (details || {}) as Prisma.InputJsonValue,
        userId
      },
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });
    
    // Trim old activities if we have too many
    const totalCount = await prisma.activity.count();
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

    // Process notifications if needed (implement separately)
    if (relatedUserIds.length > 0) {
      // This could call another service to handle notifications
      // await processActivityNotifications(activity, relatedUserIds);
    }
    
    return activity;
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw to prevent breaking core functionality
    return null;
  }
}

/**
 * Helper functions for common activity types
 */

export function logUserActivity(action: string, target: string, userId: string, details?: Record<string, unknown>) {
  return logActivity({ type: "user", action, target, userId, details });
}

export function logClientActivity(action: string, target: string, userId: string, details?: Record<string, unknown>) {
  return logActivity({ type: "client", action, target, userId, details });
}

export function logSystemActivity(action: string, target: string, userId: string, details?: Record<string, unknown>) {
  return logActivity({ type: "system", action, target, userId, details });
}