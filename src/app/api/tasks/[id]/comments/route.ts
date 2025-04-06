import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for comment creation
const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export async function POST(
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

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Validate request data
    const body = await request.json();
    const validatedData = commentSchema.parse(body);

    // Create the comment
    const comment = await prisma.taskComment.create({
      data: {
        content: validatedData.content,
        taskId: taskId,
        userId: currentUser.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "task",
        action: "commented",
        target: task.title,
        details: { taskId: task.id, commentId: comment.id },
        userId: currentUser.id,
      },
    });

    // Create notification for task owner if different from commenter
    if (task.assignedById !== currentUser.id) {
      await prisma.notification.create({
        data: {
          title: "New Comment on Task",
          content: `${currentUser.name} commented on task: ${task.title}`,
          sentById: currentUser.id,
          sentToId: task.assignedById,
        },
      });
    }

    // Create notification for assigned user if different from commenter
    if (task.assignedToId && task.assignedToId !== currentUser.id) {
      await prisma.notification.create({
        data: {
          title: "New Comment on Task",
          content: `${currentUser.name} commented on task: ${task.title}`,
          sentById: currentUser.id,
          sentToId: task.assignedToId,
        },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get task comments
    const comments = await prisma.taskComment.findMany({
      where: { taskId: taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}