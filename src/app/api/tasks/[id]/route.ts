import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendTaskStatusUpdateNotification, sendTaskAssignedNotification } from "@/lib/notifications";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";

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
  status: z.enum(["pending", "in-progress", "review", "completed", "cancelled"]).optional(),
  dueDate: z.string().optional().nullable(),
  // Add support for array of assignees
  assignedToIds: z.array(z.string()).optional(),
  // Keep for backward compatibility
  assignedToId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  note: z.string().optional(),
});

export async function GET(
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
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        // Add this inclusion for all assignees
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
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
      task.assignedToId === currentUser.id ||
      // Add check for being in assignees list
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
      const validatedData = taskUpdateSchema.parse(body);
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

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...body,
        // Ensure we're not changing assignedById through this endpoint
        assignedById: undefined,
      },
      include: {
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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

    // Send notification if assignee changed
    if (
      body.assignedToId &&
      body.assignedToId !== originalTask.assignedToId &&
      body.assignedToId !== currentUser.id
    ) {
      await sendTaskAssignedNotification(
        originalTask.id,
        originalTask.title,
        currentUser.id,
        body.assignedToId,
        body.note || undefined,
        originalTask.dueDate || undefined
      );
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