import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendTaskStatusUpdateNotification, sendTaskAssignedNotification } from "@/lib/notifications";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fix: Await params before accessing id
    const taskId = (await params).id;
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

    // Fetch the task with related data
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
      task.assignedToId === currentUser.id;

    if (!canViewTask) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
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
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Now check permissions after task is fetched
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
  { params }: { params: { id: string } }
) {
  try {
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
      where: { id: params.id },
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

    // Delete the task
    await prisma.task.delete({
      where: { id: params.id },
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