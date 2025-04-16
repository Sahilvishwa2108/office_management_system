import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    // Check if user is junior staff (BUSINESS_EXECUTIVE or BUSINESS_CONSULTANT)
    if (
      currentUser.role !== "BUSINESS_EXECUTIVE" && 
      currentUser.role !== "BUSINESS_CONSULTANT"
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Current date for deadline calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all tasks assigned to the current user
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: currentUser.id,
      },
      include: {
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Calculate basic task metrics
    const completedTasks = tasks.filter(task => task.status === "completed");
    const activeTasks = tasks.filter(task => task.status !== "completed" && task.status !== "cancelled");
    const pendingTasks = tasks.filter(task => task.status === "pending");
    const inProgressTasks = tasks.filter(task => task.status === "in-progress");
    
    // Calculate overdue tasks (not completed and past due date)
    const overdueTasks = tasks.filter(
      task => 
        task.status !== "completed" && 
        task.status !== "cancelled" && 
        task.dueDate && 
        new Date(task.dueDate) < now
    );

    // Calculate completion rate (completed tasks / total tasks with due dates that have passed)
    const tasksWithDueDatePassed = tasks.filter(
      task => task.dueDate && new Date(task.dueDate) < now
    );
    
    const completionRate = tasksWithDueDatePassed.length > 0
      ? Math.round((completedTasks.filter(
          task => task.dueDate && new Date(task.dueDate) < now
        ).length / tasksWithDueDatePassed.length) * 100)
      : 100; // If no tasks with due dates, completion rate is 100%

    // Get upcoming deadlines
    const upcomingDeadlines = tasks
      .filter(task => 
        task.dueDate && 
        task.status !== "completed" && 
        task.status !== "cancelled"
      )
      .map(task => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate?.toISOString() || "",
        status: task.status,
        priority: task.priority,
        isOverdue: task.dueDate && new Date(task.dueDate) < now,
      }))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Get recent activities for this user
    const recentActivities = await prisma.activity.findMany({
      where: {
        OR: [
          { userId: currentUser.id },
          { 
            type: "task", 
            details: {
              path: ["taskId"],
              array_contains: tasks.map(t => t.id)
            }
          }
        ]
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Format tasks for dashboard
    const formattedTasks = tasks.map(task => {
      // Calculate progress based on status
      let progress = 0;
      switch (task.status) {
        case "pending": progress = 0; break;
        case "in-progress": progress = 50; break;
        case "review": progress = 75; break;
        case "completed": progress = 100; break;
        default: progress = 0;
      }

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString(),
        progress,
        assignedBy: task.assignedBy ? {
          id: task.assignedBy.id,
          name: task.assignedBy.name,
        } : null,
      };
    });

    // Format activities for display
    const formattedActivities = recentActivities.map(activity => ({
      id: activity.id,
      type: activity.type,
      action: activity.action,
      target: activity.target,
      timestamp: activity.createdAt.toISOString(),
    }));

    // Calculate dashboard stats
    const stats = {
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      inProgressTasks: inProgressTasks.length,
      completionRate: completionRate,
      upcomingDeadlines: upcomingDeadlines.length,
      overdueTasksCount: overdueTasks.length,
      completedThisMonth: completedTasks.filter(
        task => task.updatedAt >= thirtyDaysAgo
      ).length,
      // Add more metrics as needed
    };

    return NextResponse.json({
      stats,
      tasks: formattedTasks,
      recentActivities: formattedActivities,
      deadlines: upcomingDeadlines,
    });

  } catch (error) {
    console.error("Error fetching junior dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}