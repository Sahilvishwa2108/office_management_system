import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // Fixed import

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a partner
    if (session.user.role !== "ADMIN" && session.user.role !== "PARTNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Count staff (users who are not admins or clients)
    const totalStaff = await prisma.user.count({
      where: {
        role: {
          in: ["BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT", "PARTNER"] // Added PARTNER role
        },
        isActive: true
      }
    });

    console.log("Total staff count:", totalStaff);

    // Get staff details
    const staffMembers = await prisma.user.findMany({
      where: {
        role: {
          in: ["BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"]
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
        // Other fields you need
      }
    });

    // Fetch tasks assigned to staff managed by this partner
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assignedById: session.user.id },
          { assignedToId: { in: staffMembers.map(s => s.id) } }
        ]
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Calculate stats
    const activeTasks = tasks.filter(t =>
      t.status !== "completed" && t.status !== "cancelled"
    ).length;

    const pendingTasks = tasks.filter(t =>
      t.status === "pending"
    ).length;

    const completedTasks = tasks.filter(t =>
      t.status === "completed"
    ).length;

    // Calculate task completion rate - default to 100% if no tasks assigned
    let taskCompletionRate = 100; // Default to 100% initially

    if (completedTasks > 0) {
      // If there are completed tasks, calculate actual rate
      const tasksWithDueDate = tasks.filter(t => t.dueDate && t.status === "completed");
      if (tasksWithDueDate.length > 0) {
        const tasksCompletedOnTime = tasksWithDueDate.filter(t => {
          const completedAt = t.updatedAt;
          const dueDate = t.dueDate;
          return dueDate && completedAt <= dueDate;
        });
        taskCompletionRate = Math.round((tasksCompletedOnTime.length / tasksWithDueDate.length) * 100);
      }
    }

    // Count tasks per staff member
    const staffWithTaskCounts = staffMembers.map(s => {
      const staffTasks = tasks.filter(t => t.assignedToId === s.id);
      const activeTaskCount = staffTasks.filter(t => t.status !== "completed").length;
      const completedTaskCount = staffTasks.filter(t => t.status === "completed").length;

      return {
        ...s,
        activeTasks: activeTaskCount,
        completedTasks: completedTaskCount,
        status: "ACTIVE" // Assuming all fetched staff are active
      };
    });

    // Process tasks to include progress percentage
    const processedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString(),
      assignedTo: task.assignedTo ? {
        id: task.assignedTo.id,
        name: task.assignedTo.name,
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo.name}`
      } : undefined,
      progress: calculateTaskProgress(task.status)
    }));

    // Get recent activities (excluding login/logout)
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
        totalStaff,
        activeTasks,
        pendingTasks,
        completedTasks,
        taskCompletionRate
      },
      staff: staffWithTaskCounts,
      tasks: processedTasks,
      recentActivities: transformedActivities
    });
  } catch (error) {
    console.error("Error fetching partner dashboard data:", error);
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