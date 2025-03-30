import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority, dueDate, assignedToId, createdById } = body;
    
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedToId,
        createdById,
      },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });
    
    // Create notification for assigned user
    await prisma.notification.create({
      data: {
        content: `You've been assigned a new task: ${title}`,
        type: 'TASK_ASSIGNED',
        senderId: createdById,
        recipientId: assignedToId,
        relatedTaskId: task.id,
      }
    });
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}