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
        role: true,
        avatar: true,
        // Other fields you need
      }
    });

    // Fetch tasks assigned to staff managed by this partner
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assignedById: session.user.id },
          { assignees: { some: { userId: { in: staffMembers.map(s => s.id) } } } }
        ]
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
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
      const staffTasks = tasks.filter(t => 
        t.assignees.some(a => a.userId === s.id)
      );
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
    const processedTasks = tasks.map(task => {
      // Get the first assignee if available for backward compatibility
      const primaryAssignee = task.assignees.length > 0 
        ? task.assignees[0].user 
        : null;

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString(),
        // Use primary assignee from assignees array
        assignedTo: primaryAssignee ? {
          id: primaryAssignee.id,
          name: primaryAssignee.name,
          image: primaryAssignee.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${primaryAssignee.name}`
        } : undefined,
        // Include all assignees for more flexibility
        assignees: task.assignees.map(a => ({
          id: a.user.id,
          name: a.user.name,
          image: a.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${a.user.name}`
        })),
        progress: calculateTaskProgress(task.status)
      };
    });

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
            role: true,
            avatar: true
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
        avatar: activity.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${activity.user.name}`
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
    case "in_progress":
      return 50;
    case "review":
      return 80;
    case "completed":
      return 100;
    default:
      return 0;
  }
}