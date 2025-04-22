import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Authorization checks
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can approve billing
    if (session.user.role !== "ADMIN" &&
      !(session.user.role === "PARTNER" && session.user.canApproveBilling)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Fix: Resolve params if it's a Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const taskId = resolvedParams.id;

    // Get the task with client information
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        client: true,
        assignedBy: { select: { id: true, name: true } },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
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
              billedAt: new Date().toISOString(),
              priority: task.priority,
              dueDate: task.dueDate ? task.dueDate.toISOString() : null,
              // Only include relevant task details, not comments/discussions
              assignedBy: task.assignedBy ? {
                id: task.assignedBy.id,
                name: task.assignedBy.name
              } : null,
              assignees: task.assignees.map(assignee => ({
                id: assignee.user.id,
                name: assignee.user.name
              }))
            }
          }
        });
      }

      // 2. Update task billing status (only needed for logging/auditing)
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          billingStatus: "billed",
          billingDate: new Date(),
        }
      });
      console.log(`Task ${updatedTask.id} updated with billing status: ${updatedTask.billingStatus}`);

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

      // 4. Delete task immediately instead of scheduling
      // No need to check client existence since we've already created history if needed
      await tx.task.delete({
        where: { id: taskId }
      });
    });

    // Return more detailed success response
    return NextResponse.json({
      success: true,
      message: "Task billing approved successfully",
      taskId: taskId,
      billingStatus: "billed",
      billingDate: new Date()
    });
  } catch (error) {
    console.error("Error approving task billing:", error);
    return NextResponse.json(
      { error: "Failed to approve task billing" },
      { status: 500 }
    );
  }
}