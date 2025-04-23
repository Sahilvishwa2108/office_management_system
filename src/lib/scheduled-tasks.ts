import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { logSystemActivity } from '@/lib/activity-logger';

// Function to check and delete expired guest clients
async function checkForExpiredClients() {
  console.log('Running scheduled task: Check for expired guest clients');
  
  try {
    // Get current date
    const now = new Date();
    
    // Find all guest clients with expired access
    const expiredClients = await prisma.client.findMany({
      where: {
        isGuest: true,
        accessExpiry: {
          lt: now
        }
      },
      include: {
        tasks: true,
        attachments: true,
        manager: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (expiredClients.length === 0) {
      console.log('No expired guest clients found');
      return;
    }
    
    console.log(`Found ${expiredClients.length} expired guest clients`);
    
    // Delete each expired client
    for (const client of expiredClients) {
      try {
        // Log the deletion as an activity
        await logSystemActivity(
          "auto_deleted",
          `Guest client: ${client.contactPerson}`,
          client.managerId,
          {
            reason: "access_expired",
            expiredOn: client.accessExpiry,
            clientEmail: client.email,
            clientPhone: client.phone
          }
        );
        
        // Delete the client
        await prisma.client.delete({
          where: { id: client.id }
        });
        
        console.log(`Successfully deleted expired guest client: ${client.contactPerson} (ID: ${client.id})`);
      } catch (error) {
        console.error(`Failed to delete expired guest client ${client.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in checkForExpiredClients task:', error);
  }
}

// Function to check and delete tasks scheduled for deletion
async function checkForScheduledTaskDeletions() {
  console.log('Running scheduled task: Check for tasks scheduled for deletion');
  
  try {
    // Get current date
    const now = new Date();
    
    // Find all tasks scheduled for deletion
    const tasksToDelete = await prisma.task.findMany({
      where: {
        scheduledDeletionDate: {
          lt: now
        },
        billingStatus: "billed" // Only delete tasks that have been billed
      },
      include: {
        client: {
          select: {
            id: true,
            contactPerson: true
          }
        },
        assignedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (tasksToDelete.length === 0) {
      console.log('No tasks scheduled for deletion found');
      return;
    }
    
    console.log(`Found ${tasksToDelete.length} tasks scheduled for deletion`);
    
    // Delete each scheduled task
    for (const task of tasksToDelete) {
      try {
        // Verify that the task history has been created before deletion
        if (task.clientId) {
          const historyExists = await prisma.clientHistory.findFirst({
            where: { 
              taskId: task.id,
              clientId: task.clientId
            }
          });
          
          if (!historyExists) {
            console.log(`⚠️ Warning: Task ${task.id} (${task.title}) has no history entry but is scheduled for deletion. Skipping deletion.`);
            continue;
          }
        }
        
        // Log the deletion as an activity
        await logSystemActivity(
          "auto_deleted",
          `Task: ${task.title}`,
          task.assignedById,
          {
            reason: "billing_completed",
            taskId: task.id,
            deletedOn: new Date(),
            clientId: task.clientId
          }
        );
        
        // Delete the task
        await prisma.task.delete({
          where: { id: task.id }
        });
        
        console.log(`Successfully deleted scheduled task: ${task.title} (ID: ${task.id})`);
      } catch (error) {
        console.error(`Failed to delete scheduled task ${task.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in checkForScheduledTaskDeletions task:', error);
  }
}

// Schedule tasks
export function initScheduledTasks() {
  // Run daily at 00:01 AM
  cron.schedule('1 0 * * *', checkForExpiredClients);
  
  // Run daily at noon for task deletions (matches Vercel config)
  cron.schedule('0 12 * * *', checkForScheduledTaskDeletions);
  
  console.log('Scheduled tasks initialized');
}