import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { syncTaskAssignments } from "@/lib/task-assignment";

// Update the reassignment schema
const reassignSchema = z.object({
  // Change to array of user IDs
  assignedToIds: z.array(z.string()),
  note: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const taskId = resolvedParams.id;

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

    // Permission check: Only admin or partner can reassign
    if (currentUser.role !== "ADMIN" && currentUser.role !== "PARTNER") {
      return NextResponse.json(
        { error: "You don't have permission to reassign tasks" },
        { status: 403 }
      );
    }

    // Update the task query to include assignees but not assignedTo
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: {
          include: {
            user: true
          }
        },
        assignedBy: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update the permission check to use the assignees
    if (currentUser.role === "PARTNER") {
      const isCreator = task.assignedById === currentUser.id;
      const isAssignee = task.assignees.some(a => a.userId === currentUser.id);
      
      if (!isCreator && !isAssignee) {
        return NextResponse.json(
          { error: "You don't have permission to reassign this task" },
          { status: 403 }
        );
      }
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = reassignSchema.parse(body);

    // Verify all users being assigned exist
    const assignees = await prisma.user.findMany({
      where: { id: { in: validatedData.assignedToIds } },
    });

    if (assignees.length !== validatedData.assignedToIds.length) {
      return NextResponse.json(
        { error: "One or more selected users do not exist" },
        { status: 400 }
      );
    }

    // Execute reassignment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Use the helper function to handle all assignment logic
      return syncTaskAssignments(tx, taskId, validatedData.assignedToIds);
    });

    // When tracking previous assignees, make sure to handle the case where assignees might not be loaded
    const previousAssignees = task.assignees || [];
    const previousAssigneeIds = previousAssignees.map(a => a.userId);

    // Log activity
    await prisma.activity.create({
      data: {
        type: "task",
        action: "reassigned",
        target: task.title,
        details: {
          taskId: task.id,
          previousAssigneeIds: previousAssigneeIds,
          newAssigneeIds: validatedData.assignedToIds,
          note: validatedData.note,
        },
        userId: currentUser.id,
      },
    });

    // Send notifications to new assignees
    for (const assigneeId of validatedData.assignedToIds) {
      // Skip notification to self and existing assignees
      if (assigneeId !== currentUser.id) {
        await prisma.notification.create({
          data: {
            title: "New Task Assigned",
            content: `${currentUser.name} assigned you a task: ${task.title}${
              validatedData.note ? ` - Note: ${validatedData.note}` : ""
            } [taskId: ${task.id}]`,
            taskId: task.id,
            sentById: currentUser.id,
            sentToId: assigneeId,
          },
        });
      }
    }

    // Notify previous assignees if they are no longer assigned
    for (const previousAssigneeId of previousAssigneeIds) {
      if (!validatedData.assignedToIds.includes(previousAssigneeId)) {
        await prisma.notification.create({
          data: {
            title: "Task Reassigned",
            content: `Your task "${task.title}" has been reassigned to another user`,
            sentById: currentUser.id,
            sentToId: previousAssigneeId,
          },
        });
      }
    }

    // Send email notifications to new assignees
    for (const assignee of assignees) {
      if (assignee.email) {
        try {
          await sendEmail({
            to: assignee.email,
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
    }

    return NextResponse.json(result);
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