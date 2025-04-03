import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

// Schema for task update validation
const taskUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["pending", "in-progress", "review", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
});

// GET task by ID
export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const id = params.id;
    
    // Query that strictly follows the schema
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
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
    
    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const id = params.id;
    const data = await request.json();
    
    // Validate input data
    const validationResult = taskUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data format", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // Get existing task to compare changes
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            contactPerson: true,
          }
        }
      },
    });
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    // Update the task with proper relation handling
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        // Handle optional relations properly
        assignedTo: data.assignedToId !== undefined ? 
          data.assignedToId ? { connect: { id: data.assignedToId } } : { disconnect: true } :
          undefined,
        client: data.clientId !== undefined ?
          data.clientId ? { connect: { id: data.clientId } } : { disconnect: true } :
          undefined,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
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
    
    // Log activity based on what changed
    // If status is changing to completed, log a completion activity
    if (data.status === "completed" && task.status !== "completed") {
      await logActivity(
        "task",
        "completed",
        task.title,
        session.user.id,
        { taskId: task.id }
      );
    } 
    // If assignee is changing, log an assignment activity
    else if (data.assignedToId && data.assignedToId !== task.assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { name: true }
      });
      
      await logActivity(
        "task",
        "assigned",
        `${task.title} to ${assignee?.name || "unknown"}`,
        session.user.id,
        { taskId: task.id, assigneeId: data.assignedToId }
      );
    }
    // For other updates
    else {
      await logActivity(
        "task",
        "updated",
        task.title,
        session.user.id,
        { taskId: task.id }
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

// DELETE task
export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const id = params.id;
    
    // Get task details for activity log
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
      },
    });
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    // Only allow admins, partners, or the task creator to delete tasks
    if (session.user.role !== "ADMIN" && session.user.role !== "PARTNER") {
      const isTaskCreator = await prisma.task.findFirst({
        where: {
          id,
          assignedById: session.user.id,
        },
      });
      
      if (!isTaskCreator) {
        return NextResponse.json(
          { error: "You don't have permission to delete this task" },
          { status: 403 }
        );
      }
    }
    
    // Delete the task
    await prisma.task.delete({
      where: { id },
    });
    
    // Log the activity
    await logActivity(
      "task",
      "deleted",
      task.title,
      session.user.id,
      { taskId: task.id }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}