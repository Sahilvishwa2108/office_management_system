import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: true,
        createdBy: true,
        attachments: true,
      },
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error(`Error fetching task ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, priority, status, dueDate, assignedToId } = body;
    
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        title,
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedToId,
        updatedAt: new Date(),
      },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });
    
    // Create notification for status update
    if (status) {
      await prisma.notification.create({
        data: {
          content: `Task "${title}" has been updated to ${status}`,
          type: 'TASK_UPDATED',
          senderId: updatedTask.createdById,
          recipientId: updatedTask.assignedToId,
          relatedTaskId: params.id,
        }
      });
    }
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error(`Error updating task ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.task.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(`Error deleting task ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}