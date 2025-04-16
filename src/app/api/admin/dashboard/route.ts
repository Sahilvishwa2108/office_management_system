import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get the session to check if user is authenticated and has admin role
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can create tasks
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can create tasks" }, { status: 403 });
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
          isActive: true
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

    const [
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      highPriorityTasks
    ] = await Promise.all([
      prisma.task.count({
        where: { status: "completed" }
      }),
      prisma.task.count({
        where: { status: "pending" }
      }),
      prisma.task.count({
        where: { status: "in-progress" }
      }),
      prisma.task.count({
        where: {
          status: { not: "completed" },
          dueDate: { lt: new Date() }
        }
      }),
      prisma.task.findMany({
        where: { 
          priority: "high",
          status: { not: "completed" }
        },
        take: 5,
        orderBy: { dueDate: "asc" },
        include: {
          assignedTo: { select: { name: true } }
        }
      })
    ]);

    // Fetch recent activities with filtering out login/logout actions
    const recentActivities = await prisma.activity.findMany({
      where: {
        action: {
          notIn: ["login", "logout"] // Exclude login and logout actions
        }
      },
      take: 20,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
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
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasksCount: overdueTasks
      },
      tasks: highPriorityTasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString() || null,
        assignedTo: task.assignedTo
      })),
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