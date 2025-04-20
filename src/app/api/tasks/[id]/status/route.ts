import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskStatus, BillingStatus } from "@prisma/client";
import { z } from "zod";

// Validation schema
const statusUpdateSchema = z.object({
  status: z.string(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 PATCH /api/tasks/${params.id}/status - Request received`);
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("❌ Unauthorized: No session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    const body = await request.json();
    console.log("📝 Request body:", body);
    
    const { status } = statusUpdateSchema.parse(body);
    console.log(`📝 New status: ${status}`);

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      console.log("❌ User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        client: true,
      },
    });

    if (!task) {
      console.log(`❌ Task ${taskId} not found`);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    console.log(`📝 Current task state:`, {
      id: task.id,
      title: task.title,
      status: task.status,
      billingStatus: task.billingStatus
    });

    // Critical section: Handle completed status change
    if (status === "completed" && task.status !== "completed") {
      console.log(`🚨 Task ${taskId} being marked as completed - should update billingStatus`);
      // Ensure we set billingStatus whether it has a client or not
      const updateData = {
        status: status as TaskStatus,
        billingStatus: BillingStatus.pending_billing
      };
      
      console.log(`📝 Update data for completed task:`, updateData);
      
      // Update the task with billing status
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData
      });
      
      console.log(`✅ Task updated:`, {
        id: updatedTask.id,
        status: updatedTask.status,
        billingStatus: updatedTask.billingStatus
      });

      // Create client history if needed
      if (task.client && !task.client.isGuest) {
        console.log(`📝 Creating client history for task ${taskId}`);
        // Create history record...
      }

      return NextResponse.json({
        message: `Task status updated to ${status}`,
        status: updatedTask.status,
        billingStatus: updatedTask.billingStatus
      });
    } else {
      // Normal status update for non-completed tasks
      console.log(`📝 Regular status update (not completion) for task ${taskId}`);
      
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { status: status as TaskStatus },
      });
      
      console.log(`✅ Task updated:`, {
        id: updatedTask.id,
        status: updatedTask.status,
        billingStatus: updatedTask.billingStatus
      });

      return NextResponse.json(updatedTask);
    }
  } catch (error) {
    console.error("❌ Error updating task status:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}