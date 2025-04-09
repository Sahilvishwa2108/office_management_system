import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admins can approve billing
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can approve billing" },
        { status: 403 }
      );
    }

    const taskId = params.id;

    // Get the task with client and comments
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        client: true,
        comments: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.billingStatus !== "pending_billing") {
      return NextResponse.json(
        { error: "Task is not pending billing" },
        { status: 400 }
      );
    }

    // Find the existing client history record for this task
    const existingHistory = await prisma.clientHistory.findFirst({
      where: { 
        taskId: task.id,
        type: "task_completed" 
      },
    });

    if (!existingHistory) {
      // If no history exists (which shouldn't happen), create one
      await prisma.clientHistory.create({
        data: {
          clientId: task.clientId!,
          content: `Task completed and billed: ${task.title}`,
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
          },
        },
      });
    } else {
      // Update the existing history entry with billing info
      await prisma.clientHistory.update({
        where: { id: existingHistory.id },
        data: {
          taskBilledDate: new Date(),
          billingDetails: { 
            billedBy: session.user.id,
            billedByName: session.user.name,
            billedAt: new Date().toISOString(),
          },
        },
      });
    }

    // Log the activity
    await prisma.activity.create({
      data: {
        type: "billing",
        action: "approved",
        target: `Task billed: ${task.title}`,
        userId: session.user.id,
        details: {
          taskId: task.id,
          clientId: task.clientId,
          commentsDeleted: task.comments.length
        }
      }
    });

    // Delete all comments first (to avoid foreign key constraints)
    await prisma.taskComment.deleteMany({
      where: { taskId: task.id },
    });

    // Delete the task
    await prisma.task.delete({
      where: { id: task.id },
    });

    return NextResponse.json({
      success: true,
      message: "Task billed and deleted successfully",
    });
  } catch (error) {
    console.error("Error approving task billing:", error);
    return NextResponse.json(
      { error: "Failed to approve billing" },
      { status: 500 }
    );
  }
}