import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma"; // Fixed import

export async function GET(_req: NextRequest) {
  try {
    // Get the session to check if user is authenticated and has partner role
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has partner role
    if (!session || session.user.role !== "PARTNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partnerId = session.user.id;

    // Fetch staff managed by this partner - using tasks they've assigned instead of non-existent managerId
    const tasksAssignedByPartner = await prisma.task.findMany({
      where: {
        assignedById: partnerId
      },
      select: {
        assignedToId: true
      }
    });
    
    const juniorStaffIds = tasksAssignedByPartner
      .map(task => task.assignedToId)
      .filter(id => id !== null) as string[];
    
    // Remove duplicates
    const uniqueStaffIds = [...new Set(juniorStaffIds)];
    
    // Fetch staff details
    const staff = await prisma.user.findMany({
      where: {
        id: { in: uniqueStaffIds },
        role: {
          in: ["BUSINESS_CONSULTANT", "BUSINESS_EXECUTIVE"]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true // Using isActive instead of status
      }
    });

    // Get staff IDs for task queries
    const staffIds = staff.map(s => s.id);

    // Fetch tasks assigned to staff managed by this partner
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assignedById: partnerId },
          { assignedToId: { in: staffIds } }
        ]
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true
            // Remove image field as it doesn't exist
          }
        }
      }
    });

    // Fetch activities related to this partner's team
    const recentActivities = await prisma.activity.findMany({
      where: {
        OR: [
          { userId: partnerId },
          { userId: { in: staffIds } }
        ]
      },
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
            // Remove image field as it doesn't exist
          }
        }
      }
    });

    // Calculate stats
    const totalStaff = staff.length;
    
    const activeTasks = tasks.filter(t => 
      t.status !== "completed" && t.status !== "cancelled"
    ).length;
    
    const pendingTasks = tasks.filter(t => 
      t.status === "pending"
    ).length;
    
    const completedTasks = tasks.filter(t => 
      t.status === "completed"
    ).length;
    
    // Calculate task completion rate
    const tasksWithDueDate = tasks.filter(t => t.dueDate && t.status === "completed");
    const tasksCompletedOnTime = tasksWithDueDate.filter(t => {
      const completedAt = t.updatedAt;
      const dueDate = t.dueDate;
      return dueDate && completedAt <= dueDate;
    });
    
    const taskCompletionRate = tasksWithDueDate.length > 0
      ? Math.round((tasksCompletedOnTime.length / tasksWithDueDate.length) * 100)
      : 0;
    
    // Calculate staff utilization - use isActive instead of status
    const activeStaff = staff.filter(s => s.isActive).length;
    const staffWithTasks = new Set(
      tasks
        .filter(t => t.status !== "completed" && t.assignedToId)
        .map(t => t.assignedToId)
    ).size;
    
    const staffUtilization = totalStaff > 0
      ? Math.round((staffWithTasks / totalStaff) * 100)
      : 0;

    // Count tasks per staff member
    const staffWithTaskCounts = staff.map(s => {
      const staffTasks = tasks.filter(t => t.assignedToId === s.id);
      const activeTaskCount = staffTasks.filter(t => t.status !== "completed").length;
      const completedTaskCount = staffTasks.filter(t => t.status === "completed").length;
      
      return {
        ...s,
        activeTasks: activeTaskCount,
        completedTasks: completedTaskCount,
        status: s.isActive ? "ACTIVE" : "INACTIVE" // Convert isActive to status for UI
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
        // Generate avatar from name instead of using image field
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo.name}`
      } : undefined,
      progress: calculateTaskProgress(task.status)
    }));

    // Transform activities for the frontend
    const transformedActivities = recentActivities.map(activity => ({
      id: activity.id,
      type: activity.type,
      user: {
        name: activity.user.name,
        role: activity.user.role,
        // Generate avatar from name instead of using image field
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
        taskCompletionRate,
        staffUtilization
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