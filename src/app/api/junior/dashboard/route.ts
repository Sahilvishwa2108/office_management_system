import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma"; // Fixed import

export async function GET(_req: NextRequest) {
  try {
    // Get the session to check if user is authenticated and has junior role
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has appropriate role
    if (!session || !["BUSINESS_CONSULTANT", "BUSINESS_EXECUTIVE"].includes(session.user.role)) {
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

    // Fetch activities by this junior staff
    const recentActivities = await prisma.activity.findMany({
      where: {
        userId: juniorId
      },
      take: 20,
      orderBy: {
        createdAt: "desc"
      }
    });
    
    // Calculate today and upcoming dates for deadline filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Filter tasks into different categories
    const activeTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
    const completedTasks = tasks.filter(t => t.status === "completed");
    const upcomingDeadlineTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === "completed" || t.status === "cancelled") return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate <= nextWeek;
    });
    
    // Calculate tasks that are overdue
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === "completed" || t.status === "cancelled") return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < today;
    });
    
    // Calculate completion rate (tasks completed on time)
    const tasksWithDueDate = tasks.filter(t => t.dueDate && t.status === "completed");
    const tasksCompletedOnTime = tasksWithDueDate.filter(t => {
      const completedAt = t.updatedAt;
      const dueDate = t.dueDate;
      return dueDate && completedAt <= dueDate;
    });
    
    const completionRate = tasksWithDueDate.length > 0
      ? Math.round((tasksCompletedOnTime.length / tasksWithDueDate.length) * 100)
      : 100; // If no tasks with due dates, default to 100%
    
    // Format deadlines for the frontend
    const deadlines = upcomingDeadlineTasks.map(task => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate!.toISOString(), // We filtered for tasks with dueDate
      status: task.status,
      priority: task.priority,
      isOverdue: overdueTasks.some(t => t.id === task.id)
    }));
    
    // Process tasks to include progress percentage
    const processedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString(),
      progress: calculateTaskProgress(task.status)
    }));

    // Transform activities for the frontend
    const transformedActivities = recentActivities.map(activity => ({
      id: activity.id,
      type: activity.type,
      action: activity.action,
      target: activity.target,
      timestamp: activity.createdAt.toISOString()
    }));

    // Return the dashboard data
    return NextResponse.json({
      stats: {
        activeTasks: activeTasks.length,
        completedTasks: completedTasks.length,
        completionRate: completionRate,
        upcomingDeadlines: upcomingDeadlineTasks.length,
        overdueTasksCount: overdueTasks.length
      },
      tasks: processedTasks,
      recentActivities: transformedActivities,
      deadlines: deadlines
    });
  } catch (error) {
    console.error("Error fetching junior dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

// Helper function to calculate task progress based on status
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
    default:
      return 0;
  }
}