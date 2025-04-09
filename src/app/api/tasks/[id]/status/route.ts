import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    const body = await request.json();
    const { status } = statusUpdateSchema.parse(body);

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
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
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Special handling for completed status
    if (status === "completed" && task.status !== "completed") {
      // If task is associated with a permanent client, mark as pending billing
      if (task.client && !task.client.isGuest) {
        // Store in client history without comments
        await prisma.clientHistory.create({
          data: {
            clientId: task.clientId!,
            content: `Task completed: ${task.title}`,
            type: "task_completed", // Special type for task history
            createdById: currentUser.id,
            taskId: task.id,
            taskTitle: task.title,
            taskDescription: task.description || "",
            taskStatus: "completed",
            taskCompletedDate: new Date(),
          },
        });

        // Update task to pending_billing status
        const updatedTask = await prisma.task.update({
          where: { id: taskId },
          data: {
            status,
            billingStatus: "pending_billing",
          },
        });

        // Log activity
        await prisma.activity.create({
          data: {
            type: "task",
            action: "status_changed",
            target: task.title,
            details: {
              oldStatus: task.status,
              newStatus: status,
              pendingBilling: true,
            },
            userId: currentUser.id,
          },
        });

        return NextResponse.json(updatedTask);
      }
    }

    // Normal status update
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "task",
        action: "status_changed",
        target: task.title,
        details: {
          oldStatus: task.status,
          newStatus: status,
        },
        userId: currentUser.id,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}