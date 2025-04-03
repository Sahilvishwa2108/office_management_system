import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest) { // Changed from req to _ since it's unused
  try {
    // Get the session to check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is authenticated and has appropriate role
    if (!["BUSINESS_CONSULTANT", "BUSINESS_EXECUTIVE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const juniorId = session.user.id;

    // Fetch tasks assigned to this junior staff
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: juniorId
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    // Fetch activities related to the current user
    // Fixed JSON query for Prisma
    const recentActivities = await prisma.activity.findMany({
      where: {
        OR: [
          { userId: session.user.id }, // Activities performed by this user
          { 
            type: "task", 
            // Fix JSON path query to work with your activity details structure
            details: {
              path: ["taskId"],
              not: undefined
            },
            // Add check for tasks assigned to this user
            target: {
              contains: session.user.id
            }
          },
          { type: "system" } // System-wide notifications they should see
        ]
      },
      take: 20,
      orderBy: {
        createdAt: "desc"
      },
      // Include user data for better activity display
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

    // Transform activities for the frontend with proper user data
    const transformedActivities = recentActivities.map(activity => ({
      id: activity.id,
      type: activity.type,
      action: activity.action,
      target: activity.target,
      // Add user data
      user: {
        id: activity.user.id,
        name: activity.user.name,
        role: activity.user.role
      },
      timestamp: activity.createdAt.toISOString()
    }));

    // Return the dashboard data
    return NextResponse.json({
      stats: {
        activeTasks: tasks.filter(t => t.status !== "completed" && t.status !== "cancelled").length,
        completedTasks: tasks.filter(t => t.status === "completed").length,
        completionRate: calculateCompletionRate(tasks),
        upcomingDeadlines: tasks.filter(t => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          return t.dueDate && t.status !== "completed" && t.status !== "cancelled" && new Date(t.dueDate) >= today && new Date(t.dueDate) <= nextWeek;
        }).length,
        overdueTasksCount: tasks.filter(t => t.dueDate && t.status !== "completed" && t.status !== "cancelled" && new Date(t.dueDate) < new Date()).length
      },
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString(),
        progress: calculateTaskProgress(task.status)
      })),
      recentActivities: transformedActivities,
      deadlines: tasks
        .filter(t => t.dueDate && t.status !== "completed" && t.status !== "cancelled")
        .map(task => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate!.toISOString(),
          status: task.status,
          priority: task.priority,
          isOverdue: task.dueDate! < new Date()
        }))
    });
  } catch (error) {
    console.error("Error fetching junior dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

// Helper function for task progress calculation
function calculateTaskProgress(status: string): number {
  switch (status) {
    case "pending":
      return 0;
    case "in-progress":
      return 50;
    case "review":
      return 80;
    case "completed":
      return 100;
    case "cancelled":
      return 0;
    default:
      return 0;
  }
}

// Helper function to calculate completion rate
function calculateCompletionRate(tasks: any[]): number {
  const tasksWithDueDate = tasks.filter(t => t.dueDate && t.status === "completed");
  const tasksCompletedOnTime = tasksWithDueDate.filter(t => {
    const completedAt = t.updatedAt;
    const dueDate = t.dueDate;
    return dueDate && completedAt <= dueDate;
  });

  return tasksWithDueDate.length > 0
    ? Math.round((tasksCompletedOnTime.length / tasksWithDueDate.length) * 100)
    : 100; // If no tasks with due dates, default to 100%
}