import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      include: {
        sender: true,
        attachments: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 50, // Limit to last 50 messages
    });
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, senderId, mentions = [], attachments = [] } = body;
    
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        mentions,
        attachments: {
          create: attachments.map((attachment: { fileName: string, fileUrl: string }) => ({
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
          })),
        },
      },
      include: {
        sender: true,
        attachments: true,
      },
    });
    
    // Create notifications for mentioned users
    if (mentions.length > 0) {
      await Promise.all(mentions.map((userId: string) => {
        return prisma.notification.create({
          data: {
            content: `You were mentioned in a message by ${message.sender.name}`,
            type: 'MENTION',
            senderId,
            recipientId: userId,
          }
        });
      }));
    }
    
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}