import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { logSystemActivity } from '@/lib/activity-service';

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

// Schedule tasks
export function initScheduledTasks() {
  // Run daily at 00:01 AM
  cron.schedule('1 0 * * *', checkForExpiredClients);
  
  console.log('Scheduled tasks initialized');
}