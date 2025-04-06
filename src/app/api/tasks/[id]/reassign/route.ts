import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

// Schema for reassignment
const reassignSchema = z.object({
  assignedToId: z.string(),
  note: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedBy: true,
        assignedTo: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user has permission to reassign this task
    const canReassign =
      currentUser.role === "ADMIN" ||
      currentUser.role === "PARTNER" ||
      task.assignedById === currentUser.id;

    if (!canReassign) {
      return NextResponse.json(
        { error: "You don't have permission to reassign this task" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = reassignSchema.parse(body);

    // Check if the user being assigned exists
    const newAssignee = await prisma.user.findUnique({
      where: { id: validatedData.assignedToId },
    });

    if (!newAssignee) {
      return NextResponse.json(
        { error: "Selected user does not exist" },
        { status: 400 }
      );
    }

    // Update the task with new assignee
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: validatedData.assignedToId,
      },
      include: {
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "task",
        action: "reassigned",
        target: task.title,
        details: {
          taskId: task.id,
          previousAssigneeId: task.assignedToId,
          newAssigneeId: validatedData.assignedToId,
          note: validatedData.note,
        },
        userId: currentUser.id,
      },
    });

    // Create notification for the new assignee
    await prisma.notification.create({
      data: {
        title: "Task Assigned",
        content: `${currentUser.name} assigned you a task: ${task.title}${
          validatedData.note ? ` - Note: ${validatedData.note}` : ""
        }`,
        sentById: currentUser.id,
        sentToId: validatedData.assignedToId,
      },
    });

    // Send email notification to the new assignee
    if (newAssignee.email) {
      try {
        await sendEmail({
          to: newAssignee.email,
          subject: `Task Assigned: ${task.title}`,
          html: `
            <h2>You've been assigned a new task</h2>
            <p><strong>Task:</strong> ${task.title}</p>
            <p><strong>Assigned by:</strong> ${currentUser.name}</p>
            ${validatedData.note ? `<p><strong>Note:</strong> ${validatedData.note}</p>` : ""}
            <p><strong>Due date:</strong> ${
              task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "No due date"
            }</p>
            <p>Log in to the system to view task details.</p>
          `,
        });
      } catch (error) {
        console.error("Failed to send email notification:", error);
      }
    }

    // If there was a previous assignee, notify them
    if (
      task.assignedToId &&
      task.assignedToId !== validatedData.assignedToId &&
      task.assignedTo
    ) {
      await prisma.notification.create({
        data: {
          title: "Task Reassigned",
          content: `Your task "${task.title}" has been reassigned to ${newAssignee.name}`,
          sentById: currentUser.id,
          sentToId: task.assignedToId,
        },
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error reassigning task:", error);
    return NextResponse.json(
      { error: "Failed to reassign task" },
      { status: 500 }
    );
  }
}