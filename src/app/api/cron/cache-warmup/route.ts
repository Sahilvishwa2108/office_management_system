import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dashboardCache } from "@/lib/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // Only allow admin users to warm the cache
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Warm up frequently used data
    const results = await Promise.allSettled([
      // Warm up dashboard stats cache
      warmUpDashboardStats(),
      
      // Warm up active clients list
      warmUpActiveClients(),
      
      // Warm up pending tasks
      warmUpPendingTasks(),

      // Warm up all users
      warmUpAllUsers()
    ]);
    
    return NextResponse.json({
      message: 'Cache warmup completed',
      results: results.map((result, index) => ({
        task: ['dashboardStats', 'activeClients', 'pendingTasks', 'allUsers'][index],
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : null,
        reason: result.status === 'rejected' ? result.reason : null
      }))
    });
  } catch (error) {
    console.error('Error in cache warmup:', error);
    return NextResponse.json(
      { error: 'Failed to warm up cache' },
      { status: 500 }
    );
  }
}

async function warmUpDashboardStats() {
  // Get counts for dashboard stats
  const [
    totalUsers,
    activeUsers,
    totalClients,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.client.count(),
    prisma.task.count(),
    prisma.task.count({ where: { status: "completed" } }),
    prisma.task.count({ where: { status: "pending" } }),
    prisma.task.count({ where: { status: "in_progress" } }),
    prisma.task.count({
      where: {
        dueDate: { lt: new Date() },
        status: { notIn: ["completed", "cancelled"] }
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
    overdueTasks
  };
  
  // Increase TTL to 12 hours since we can only run once daily
  await dashboardCache.set('global:stats', statsData, { ttl: 43200 });
  return { cached: true, items: 1 };
}

async function warmUpActiveClients() {
  // Get active clients - non-guest or guests with valid expiry
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { isGuest: false },
        {
          isGuest: true,
          accessExpiry: { gt: new Date() }
        }
      ]
    },
    take: 50,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      contactPerson: true,
      companyName: true,
      email: true,
      phone: true,
      isGuest: true,
      accessExpiry: true,
      updatedAt: true,
      _count: {
        select: {
          tasks: true
        }
      }
    }
  });
  
  // Increase TTL to 12 hours
  await dashboardCache.set('global:activeClients', clients, { ttl: 43200 });
  return { cached: true, items: clients.length };
}

async function warmUpPendingTasks() {
  // Get pending and in-progress tasks
  const tasks = await prisma.task.findMany({
    where: {
      status: { in: ['pending', 'in_progress'] }
    },
    take: 50,
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' }
    ],
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      assignees: {
        select: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      client: {
        select: {
          id: true,
          contactPerson: true
        }
      }
    }
  });
  
  // Increase TTL to 8 hours
  await dashboardCache.set('global:pendingTasks', tasks, { ttl: 28800 });
  return { cached: true, items: tasks.length };
}

// Add additional warmup functions for more comprehensive coverage
async function warmUpAllUsers() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true
    }
  });
  
  await dashboardCache.set('global:users', users, { ttl: 43200 }); // 12 hours
  return { cached: true, items: users.length };
}