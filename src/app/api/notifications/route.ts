import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma"; // Fixed import

export async function GET(req: NextRequest) {
  try {
    // Get the session to check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Notification model exists in Prisma client
    // If not, return empty array to prevent errors
    if (!prisma.notification) {
      console.warn("Notification model not found in Prisma schema");
      return NextResponse.json({ notifications: [] });
    }

    // Fetch notifications for the user
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    });

    return NextResponse.json({
      notifications: notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        description: notification.description,
        type: notification.type || "info",
        read: notification.read,
        timestamp: notification.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    
    // Gracefully handle missing models
    if ((error as any)?.message?.includes("notification")) {
      return NextResponse.json({ notifications: [] });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}