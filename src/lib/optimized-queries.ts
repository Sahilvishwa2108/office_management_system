import { prisma } from '@/lib/prisma';
import { dashboardCache } from '@/lib/cache';

// Factory for getting a client with optimal field selection
export async function getClientWithOptimalFields(clientId: string, includeTaskCount = false) {
  // Try to get from cache first
  const cacheKey = `client:${clientId}:${includeTaskCount ? 'withTasks' : 'basic'}`;
  const cachedClient = await dashboardCache.get(cacheKey);
  if (cachedClient) return cachedClient;
  
  // If not in cache, fetch from database with optimized query
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      contactPerson: true,
      companyName: true,
      email: true,
      phone: true,
      address: true,
      gstin: true,
      isGuest: true,
      accessExpiry: true,
      createdAt: true,
      updatedAt: true,
      managerId: true,
      // Only include counts if requested (more efficient)
      ...(includeTaskCount ? {
        _count: {
          select: {
            tasks: true
          }
        }
      } : {})
    }
  });
  
  // Cache the result
  if (client) {
    await dashboardCache.set(cacheKey, client, { ttl: 300 }); // 5 minutes
  }
  
  return client;
}

// Get tasks for a dashboard with optimal field selection
export async function getDashboardTasks(
  userId: string,
  status?: string,
  limit = 5
) {
  const cacheKey = `dashboard:${userId}:tasks:${status || 'all'}:${limit}`;
  const cachedTasks = await dashboardCache.get(cacheKey);
  if (cachedTasks) return cachedTasks;
  
  const where: any = {};
  if (status && status !== 'all') {
    where.status = status;
  }
  
  // Either tasks assigned to this user OR created by this user
  where.OR = [
    {
      assignees: {
        some: {
          userId
        }
      }
    },
    { assignedById: userId }
  ];
  
  const tasks = await prisma.task.findMany({
    where,
    take: limit,
    orderBy: [
      { priority: 'desc' }, // High priority first
      { dueDate: 'asc' }    // Earlier due dates first
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
              name: true,
              avatar: true
            }
          }
        }
      },
      // Include basic client info if available
      client: {
        select: {
          id: true,
          contactPerson: true,
        }
      }
    }
  });
  
  await dashboardCache.set(cacheKey, tasks, { ttl: 180 }); // 3 minutes
  return tasks;
}