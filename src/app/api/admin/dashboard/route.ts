import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma"; // Fixed import

export async function GET(req: NextRequest) {
  try {
    // Get the session to check if user is authenticated and has admin role
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch dashboard stats data
    const [
      totalUsers,
      activeUsers,
      totalClients,
      totalTasks
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          isActive: true // Assuming isActive field exists instead of status
        }
      }),
      prisma.client.count(),
      prisma.task.count({
        where: {
          status: {
            not: "completed"
          }
        }
      })
    ]);

    // Fetch recent activities
    const recentActivities = await prisma.activity.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
            // Removed image field as it likely doesn't exist
          }
        }
      }
    });

    // Transform activities for the frontend
    const transformedActivities = recentActivities.map(activity => ({
      id: activity.id,
      type: activity.type,
      user: {
        name: activity.user.name,
        role: activity.user.role,
        // Use user's name for avatar generation instead of non-existent image field
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${activity.user.name}`
      },
      action: activity.action,
      target: activity.target,
      timestamp: activity.createdAt.toISOString()
    }));

    // Return the dashboard data
    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        totalClients,
        totalTasks
      },
      recentActivities: transformedActivities
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}