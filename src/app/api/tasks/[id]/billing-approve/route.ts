import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can approve billing
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const taskId = params.id;

    // Get the task with client information
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        client: true,
        assignedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.billingStatus !== "pending_billing") {
      return NextResponse.json(
        { error: "Task is not pending billing approval" },
        { status: 400 }
      );
    }

    // Use a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // 1. Create client history entry if task has a client
      if (task.clientId) {
        await tx.clientHistory.create({
          data: {
            clientId: task.clientId,
            content: `Task "${task.title}" was completed and billing approved.`,
            type: "task_completed",
            createdById: session.user.id,
            taskId: task.id,
            taskTitle: task.title,
            taskDescription: task.description || "",
            taskStatus: "completed",
            taskCompletedDate: new Date(),
            taskBilledDate: new Date(),
            billingDetails: {
              billedBy: session.user.id,
              billedByName: session.user.name,
              billedAt: new Date().toISOString()
            }
          }
        });
      }

      // 2. Update task billing status
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          billingStatus: "billed",
          billingDate: new Date(),
          // Schedule task for deletion after history is created
          scheduledDeletionDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours later
        }
      });

      // 3. Log the activity
      await logActivity(
        "task",
        "billing_approved",
        task.title,
        session.user.id,
        {
          taskId: task.id,
          clientId: task.clientId,
          previousStatus: task.billingStatus
        }
      );

      // 4. Delete task immediately if it's not linked to a client
      if (!task.clientId) {
        await tx.task.delete({
          where: { id: taskId }
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Task billing approved successfully"
    });
  } catch (error) {
    console.error("Error approving task billing:", error);
    return NextResponse.json(
      { error: "Failed to approve task billing" },
      { status: 500 }
    );
  }
}