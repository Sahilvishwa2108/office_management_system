import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Helper function to manage task assignments using only the many-to-many relationship.
 * Optimized with parallel processing for better performance with multiple assignees.
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
  
  // 4. Remove assignees who are no longer assigned (already batch operation)
  if (assigneesToRemove.length > 0) {
    await prisma.taskAssignee.deleteMany({
      where: {
        taskId,
        userId: { in: assigneesToRemove }
      }
    });
  }
  
  // 5. Add new assignees using parallel processing instead of sequential loop
  if (assigneesToAdd.length > 0) {
    await Promise.all(
      assigneesToAdd.map(userId => 
        prisma.taskAssignee.create({
          data: {
            task: { connect: { id: taskId } },
            user: { connect: { id: userId } },
          }
        })
      )
    );
  }
  
  // 6. Return the updated task with assignees
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
      }
    }
  });
}