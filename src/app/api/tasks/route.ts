import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendTaskAssignedNotification } from "@/lib/notifications";

// Schema for task creation
const taskCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in-progress", "review", "completed", "cancelled"]),
  dueDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
});

// GET all tasks with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToMe = searchParams.get("assignedToMe") === "true";

    // Build the where clause for filtering
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (assignedToMe && session.user.id) {
      where.assignedToId = session.user.id;
    }

    // Get tasks with related data
    const tasks = await prisma.task.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },
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
          },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can create tasks
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can create tasks" }, { status: 403 });
    }

    // Get current user for assignedBy
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate request data
    const validatedData = taskCreateSchema.parse(body);

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        status: validatedData.status,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        assignedById: currentUser.id,
        assignedToId: validatedData.assignedToId,
        clientId: validatedData.clientId,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "task",
        action: "created",
        target: validatedData.title,
        details: { taskId: task.id },
        userId: currentUser.id,
      },
    });

    // Send notification if task is assigned to someone else
    if (validatedData.assignedToId && validatedData.assignedToId !== currentUser.id) {
      await sendTaskAssignedNotification(
        task.id,
        validatedData.title,
        currentUser.id,
        validatedData.assignedToId,
        undefined,
        validatedData.dueDate ? new Date(validatedData.dueDate) : undefined
      );
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
