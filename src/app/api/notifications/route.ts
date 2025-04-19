import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to clean up old notifications
async function cleanupOldNotifications(userId: string, maxNotifications: number = 20) {
  try {
    // Get all notifications for the user, ordered by creation date
    const allUserNotifications = await prisma.notification.findMany({
      where: { sentToId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    // If we have more than the max, delete the oldest ones
    if (allUserNotifications.length > maxNotifications) {
      // Get IDs of notifications to delete (everything beyond the max)
      const notificationsToDelete = allUserNotifications
        .slice(maxNotifications)
        .map(n => n.id);

      // Delete the old notifications
      if (notificationsToDelete.length > 0) {
        await prisma.notification.deleteMany({
          where: {
            id: { in: notificationsToDelete }
          }
        });
        
        console.log(`Cleaned up ${notificationsToDelete.length} old notifications for user ${userId}`);
      }
    }
  } catch (error) {
    console.error("Error cleaning up old notifications:", error);
  }
}

// Get notifications with pagination and filters
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    // Return empty data instead of 401 when not authenticated
    // This prevents errors in components that might load before auth is ready
    if (!session?.user) {
      return NextResponse.json({
        data: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 0 },
        unreadCount: 0
      });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({
        data: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 0 },
        unreadCount: 0
      });
    }

    // Clean up old notifications - keep only 20 most recent
    await cleanupOldNotifications(currentUser.id, 20);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get("limit") || "10");
    
    // Always cap the limit to 20
    if (limit > 20) limit = 20;
    
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const format = searchParams.get("format") || "default"; // 'default' or 'dashboard'

    // Build the where condition
    const whereCondition = {
      sentToId: currentUser.id,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sentBy: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      skip,
      take: limit,
    });

    // Count total notifications for pagination
    const totalCount = await prisma.notification.count({
      where: whereCondition,
    });

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        sentToId: currentUser.id,
        isRead: false,
      },
    });

    // Format response based on requested format
    if (format === "dashboard") {
      return NextResponse.json({
        unreadCount,
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          description: n.content,
          type: n.title.toLowerCase().includes("task") && n.title.toLowerCase().includes("completed") 
            ? "success" 
            : n.title.toLowerCase().includes("overdue") || n.title.toLowerCase().includes("urgent")
            ? "warning"
            : "info",
          read: n.isRead,
          sender: n.sentBy?.name || "System",
          timestamp: n.createdAt
        }))
      });
    }

    // Default response format
    return NextResponse.json({
      data: notifications.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        isRead: n.isRead,
        createdAt: n.createdAt,
        sentById: n.sentById,
        sentByName: n.sentBy?.name
      })),
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, Message: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    }
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// Mark all notifications as read
export async function PATCH() {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Mark all notifications as read
    const updated = await prisma.notification.updateMany({
      where: {
        sentToId: currentUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      message: `${updated.count} notifications marked as read`,
      count: updated.count,
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// Delete all notifications
export async function DELETE() {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete all notifications for this user
    await prisma.notification.deleteMany({
      where: {
        sentToId: currentUser.id,
      },
    });

    return NextResponse.json({
      message: "All notifications deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    );
  }
}