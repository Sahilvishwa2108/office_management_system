import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Helper function to manage task assignments using only the many-to-many relationship.
 * This eliminates the inconsistency between assignedToId and assignees.
 * 
 * @param prisma Prisma client instance (or transaction client)
 * @param taskId ID of the task to update
 * @param assigneeIds Array of user IDs to assign the task to
 * @returns The updated task with assignees
 */
export async function syncTaskAssignments(
  prisma: PrismaClient | Prisma.TransactionClient,
  taskId: string,
  assigneeIds: string[]
) {
  // 1. Normalize input (remove duplicates, ensure it's an array)
  const uniqueAssigneeIds = [...new Set(assigneeIds)];
  
  // 2. Get existing assignees to minimize DB operations
  const existingAssignees = await prisma.taskAssignee.findMany({
    where: { taskId },
    select: { userId: true }
  });
  const existingAssigneeIds = existingAssignees.map(a => a.userId);
  
  // 3. Calculate which assignees to add and remove
  const assigneesToAdd = uniqueAssigneeIds.filter(id => !existingAssigneeIds.includes(id));
  const assigneesToRemove = existingAssigneeIds.filter(id => !uniqueAssigneeIds.includes(id));
  
  // 4. Remove assignees who are no longer assigned
  if (assigneesToRemove.length > 0) {
    await prisma.taskAssignee.deleteMany({
      where: {
        taskId,
        userId: { in: assigneesToRemove }
      }
    });
  }
  
  // 5. Add new assignees using proper relation connections
  for (const userId of assigneesToAdd) {
    await prisma.taskAssignee.create({
      data: {
        task: { connect: { id: taskId } },
        user: { connect: { id: userId } },
      }
    });
  }
  
  // 6. For backward compatibility, update the legacy assignedToId field
  // This is only for backward compatibility and will be deprecated in the future
  if (uniqueAssigneeIds.length > 0) {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: uniqueAssigneeIds[0]
      }
    });
  } else {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: null
      }
    });
  }
  
  // 7. Return the updated task with assignees
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            }
          }
        }
      },
      // Still include assignedTo for backward compatibility
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
        }
      },
    }
  });
}