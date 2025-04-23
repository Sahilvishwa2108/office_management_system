import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSystemActivity } from "@/lib/activity-logger";

export async function POST(request: Request) {
  try {
    // Check for API key for security
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
      return NextResponse.json({ message: 'No tasks scheduled for deletion found' });
    }
    
    // Process each task for deletion
    const results = await Promise.all(
      tasksToDelete.map(async (task) => {
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
              return { 
                id: task.id, 
                title: task.title, 
                success: false, 
                error: "No history entry found" 
              };
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
          
          return { id: task.id, title: task.title, success: true };
        } catch (error) {
          console.error(`Failed to delete scheduled task ${task.id}:`, error);
          return { 
            id: task.id, 
            title: task.title, 
            success: false, 
            error: String(error)
          };
        }
      })
    );
    
    return NextResponse.json({
      message: `Processed ${tasksToDelete.length} tasks scheduled for deletion`,
      deletedCount: results.filter(r => r.success).length,
      results
    });
    
  } catch (error) {
    console.error("Error processing scheduled task deletions:", error);
    return NextResponse.json(
      { error: "Failed to process scheduled task deletions" },
      { status: 500 }
    );
  }
}