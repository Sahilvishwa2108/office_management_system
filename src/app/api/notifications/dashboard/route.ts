import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        sentToId: session.user.id,
        isRead: false
      }
    });

    // Get recent notifications
    const notifications = await prisma.notification.findMany({
      where: {
        sentToId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10,
      include: {
        sentBy: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      unreadCount,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        description: n.content,
        type: n.title.toLowerCase().includes("role") ? "warning" : 
              n.title.toLowerCase().includes("complete") ? "success" : "info",
        read: n.isRead,
        sender: n.sentBy.name,
        timestamp: n.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching dashboard notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}