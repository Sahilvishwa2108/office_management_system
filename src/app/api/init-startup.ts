import { initScheduledTasks } from '@/lib/scheduled-tasks';
import cron from 'node-cron';
import { prisma } from '@/lib/prisma';

// Only start if we're in a server environment
if (typeof window === 'undefined') {
  initScheduledTasks();
}

const cleanupCompletedTasks = async () => {
  console.log("Cleaning up completed tasks...");
  
  try {
    // Find tasks scheduled for deletion
    const tasksToDelete = await prisma.task.findMany({
      where: {
        // Use an existing date field from your Task model
        updatedAt: {
          lte: new Date()
        },
        billingStatus: "billed"
      }
    });
    
    if (tasksToDelete.length > 0) {
      console.log(`Deleting ${tasksToDelete.length} completed tasks`);
      
      // Delete the tasks
      await prisma.task.deleteMany({
        where: {
          id: { in: tasksToDelete.map(task => task.id) }
        }
      });
    }
  } catch (error) {
    console.error("Error cleaning up completed tasks:", error);
  }
};

// Run cleanup job daily at midnight
cron.schedule("0 0 * * *", cleanupCompletedTasks);

export const startupComplete = true;