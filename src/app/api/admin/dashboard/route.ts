import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardCache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('dataType') || 'full';

    // Create cache key based on data type and user ID (to avoid leaking data between users)
    const cacheKey = `${session.user.id}:${dataType}`;

    // Try to get from cache first
    const cachedData = await dashboardCache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // For stats, we can cache longer since these don't change as frequently
    if (dataType === 'stats') {
      const [
        totalUsers,
        activeUsers,
        totalClients,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        newUsersThisMonth
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { isActive: true }
        }),
        prisma.client.count(),
        prisma.task.count(),
        prisma.task.count({
          where: { status: "completed" }
        }),
        prisma.task.count({
          where: { status: "pending" }
        }),
        prisma.task.count({
          where: { status: "in_progress" }
        }),
        prisma.task.count({
          where: {
            dueDate: { lt: new Date() },
            status: { notIn: ["completed", "cancelled"] }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1)) // First day of current month
            }
          }
        })
      ]);

      const statsData = {
        totalUsers,
        activeUsers,
        totalClients,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        newUsersThisMonth
      };

      // Cache the stats data for 5 minutes (300 seconds)
      await dashboardCache.set(cacheKey, statsData, { ttl: 300 });

      return NextResponse.json(statsData);
    }

    // For overview, cache for a shorter time as tasks might change more frequently
    if (dataType === 'overview') {
      // Fetch only tasks
      const highPriorityTasks = await prisma.task.findMany({
        where: { 
          priority: "high",
          status: { not: "completed" }
        },
        take: 5,
        orderBy: { dueDate: "asc" },
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });

      const overviewData = {
        tasks: highPriorityTasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate?.toISOString() || null,
          assignees: task.assignees.map(a => ({
            id: a.user.id,
            name: a.user.name
          }))
        }))
      };

      // Cache the overview data for 2 minutes (120 seconds)
      await dashboardCache.set(cacheKey, overviewData, { ttl: 120 });

      return NextResponse.json(overviewData);
    }

    // For full data request, return everything
    // This is the original implementation
    const partners = await prisma.user.findMany({
      where: { role: "PARTNER" },
      select: { 
        id: true, 
        name: true, 
        avatar: true,
        canApproveBilling: true 
      },
    });

    // Fetch staff without tasks - UPDATED QUERY
    const staffWithoutTasks = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { not: "ADMIN" },
        // Use taskAssignments instead of assignedTasks
        taskAssignments: {
          none: {}
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true
      }
    });

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
        where: { status: "in_progress" }
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
          assignees: {
            include: {
              user: {
                select: { id: true, name: true }
              }
            }
          }
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
    const fullData = {
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
        assignees: task.assignees.map(a => ({
          id: a.user.id,
          name: a.user.name
        }))
      })),
      recentActivities: transformedActivities,
      partners,
      staffWithoutTasks,
    };

    // Cache the full data for 1 minute (60 seconds)
    await dashboardCache.set(cacheKey, fullData, { ttl: 60 });

    return NextResponse.json(fullData);
  } catch (error) {
    console.error("Error in status route:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

// Update billing approval status for partners
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { updates } = await request.json(); // Array of { id, canApproveBilling }

  try {
    const updatePromises = updates.map(async (update) => {
      const updatedUser = await prisma.user.update({
        where: { id: update.id },
        data: { canApproveBilling: update.canApproveBilling },
      });

      // Send notification if canApproveBilling is marked true
      if (update.canApproveBilling) {
        await prisma.notification.create({
          data: {
            title: "Permission Granted",
            content: "You have been granted permission to approve billing requests. You can now approve billing on dashboard and task pages.",
            sentById: session.user.id, // Admin who made the change
            sentToId: updatedUser.id, // Partner receiving the notification
          },
        });
      }
    });
    await Promise.all(updatePromises);
    return NextResponse.json({ message: "Permissions updated successfully" });
  } catch (error) {
    console.error("Failed to update permissions:", error);
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}