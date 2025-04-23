import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTaskStatusUpdateNotification, sendTaskAssignedNotification } from "@/lib/notifications";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { syncTaskAssignments } from "@/lib/task-assignment";
import { dashboardCache, taskCache, clientCache } from "@/lib/cache";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Task update schema
const taskUpdateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["pending", "in_progress", "review", "completed", "cancelled"]).optional(),
  dueDate: z.string().optional().nullable(),
  // Add support for array of assignees
  assignedToIds: z.array(z.string()).optional(),
  // Keep for backward compatibility
  assignedToId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  note: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
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

    // Fetch the task with related data, including all assignees
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        // Add this to include the last status updater
        lastStatusUpdatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            contactPerson: true,
            companyName: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user has permission to view this task
    const canViewTask =
      currentUser.role === "ADMIN" ||
      task.assignedById === currentUser.id ||
      task.assignees.some(a => a.userId === currentUser.id);

    if (!canViewTask) {
      return NextResponse.json(
        { error: "You don't have permission to view this task" },
        { status: 403 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task details" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch the task first, before using it in permission checks
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: {
          include: {
            user: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Maintain original permission checks
    if (currentUser.role !== "ADMIN") {
      // Partners can update the status of any task
      if (currentUser.role === "PARTNER" && Object.keys(body).length === 1 && body.hasOwnProperty("status")) {
        // This is allowed - only updating status
      }
      // Partners can update tasks they created
      else if (currentUser.role === "PARTNER" && task.assignedById === currentUser.id) {
        // This is allowed - partner is updating their own task
      }
      // Junior staff can only update status
      else if (Object.keys(body).length > 1 || !body.hasOwnProperty("status")) {
        return NextResponse.json(
          { error: "You can only update the task status" },
          { status: 403 }
        );
      }
    }

    // Validate update data
    try {
      taskUpdateSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({ error: validationError.errors }, { status: 400 });
      }
    }

    const originalTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!originalTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Use a transaction to update everything atomically
    const updatedTask = await prisma.$transaction(async (tx) => {
      // Extract assignedToIds from body and remove it
      const { assignedToIds, assignedToId, ...updateData } = body;

      // If we're updating status, also update the lastStatusUpdatedBy fields
    if (updateData.status && updateData.status !== task.status) {
      updateData.lastStatusUpdatedById = currentUser.id;
      updateData.lastStatusUpdatedAt = new Date();
    }
      
      // Update the task without any assignment fields
      const updated = await tx.task.update({
        where: { id: taskId },
        data: updateData,
      });
      
      // If assignedToIds is provided, update the task assignments
      if (assignedToIds && Array.isArray(assignedToIds)) {
        return syncTaskAssignments(tx, taskId, assignedToIds);
      }
      // For backward compatibility, handle the legacy assignedToId
      else if (assignedToId) {
        return syncTaskAssignments(tx, taskId, [assignedToId]);
      }
      
      // If no assignment updates, just return the updated task
      return updated;
    });

    // Log the activity
    await prisma.activity.create({
      data: {
        type: "task",
        action: "updated",
        target: task.title,
        details: { taskId: task.id },
        userId: currentUser.id,
      },
    });

    // Send notification if status changed
    if (body.status && body.status !== originalTask.status) {
      await sendTaskStatusUpdateNotification(
        originalTask.id,
        originalTask.title,
        currentUser.id,
        originalTask.assignedById,
        originalTask.status,
        body.status
      );
    }

    // Send notifications when assignees change
    if (body.assignedToIds && Array.isArray(body.assignedToIds)) {
      // Get existing assignees to compare
      const existingAssignees = await prisma.taskAssignee.findMany({
        where: { taskId },
        select: { userId: true }
      });
      const existingAssigneeIds = existingAssignees.map(a => a.userId);
      
      // Find new assignees (those in body.assignedToIds but not in existingAssigneeIds)
      const newAssigneeIds = body.assignedToIds.filter(id => 
        !existingAssigneeIds.includes(id) && id !== currentUser.id
      );
      
      // Send notifications to each new assignee
      for (const newAssigneeId of newAssigneeIds) {
        await sendTaskAssignedNotification(
          originalTask.id,
          originalTask.title,
          currentUser.id,
          newAssigneeId,
          body.note || undefined,
          originalTask.dueDate || undefined
        );
      }
    }
    // Handle the legacy assignedToId field for backward compatibility
    else if (body.assignedToId && body.assignedToId !== currentUser.id) {
      // Get existing assignees to check if this is actually a new assignee
      const existingAssignees = await prisma.taskAssignee.findMany({
        where: { taskId },
        select: { userId: true }
      });
      const existingAssigneeIds = existingAssignees.map(a => a.userId);
      
      // Only send notification if this is a new assignee
      if (!existingAssigneeIds.includes(body.assignedToId)) {
        await sendTaskAssignedNotification(
          originalTask.id,
          originalTask.title,
          currentUser.id,
          body.assignedToId,
          body.note || undefined,
          originalTask.dueDate || undefined
        );
      }
    }

    // Invalidate related caches
    await taskCache.delete(`task:${taskId}`);
    await dashboardCache.invalidate('*'); // Clear all dashboard caches
    
    // If client assignment changed, invalidate client cache
    if (body.clientId && body.clientId !== originalTask?.clientId) {
      await clientCache.delete(`client:${body.clientId}`);
      if (originalTask?.clientId) {
        await clientCache.delete(`client:${originalTask.clientId}`);
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch the task to check permissions
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Only admin or the partner who created the task can delete it
    if (currentUser.role !== "ADMIN" && 
      !(currentUser.role === "PARTNER" && task.assignedById === currentUser.id)) {
    return NextResponse.json(
      { error: "You don't have permission to delete this task" },
      { status: 403 }
    );
  }



  // Fetch all comments for the task
  const comments = await prisma.taskComment.findMany({
    where: { taskId },
    select: { attachments: true }, // Assuming `attachments` is stored in comments
  });

  // Extract public_ids of attachments from comments
  const publicIds = comments
    .flatMap((comment) => comment.attachments || [])
    .map((attachment) => (attachment as { public_id: string })?.public_id)
    .filter((publicId) => publicId !== undefined);

  // Delete attachments from Cloudinary
  if (publicIds.length > 0) {
    await cloudinary.api.delete_resources(publicIds);
  }

  // Delete comments from Prisma
  await prisma.taskComment.deleteMany({
    where: { taskId },
  });





    // Delete the task
    await prisma.task.delete({
      where: { id: taskId },
    });

    // Log the activity
    await prisma.activity.create({
      data: {
        type: "task",
        action: "deleted",
        target: task.title,
        details: { taskId: task.id },
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}