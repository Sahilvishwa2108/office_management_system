import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redis, pubRedis } from "@/lib/redis";

const CHAT_HISTORY_KEY = "group_chat";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { messageId, newText } = await req.json();
    
    if (!messageId || !newText) {
      return NextResponse.json(
        { error: "Message ID and new text are required" },
        { status: 400 }
      );
    }
    
    // Get all messages
    const messages = await redis.lrange(CHAT_HISTORY_KEY, 0, -1);
    const updatedMessages: string[] = [];
    let messageFound = false;
    
    for (const messageStr of messages) {
      const message = JSON.parse(messageStr);
      
      if (message.id === messageId) {
        // Verify user is editing their own message
        if (message.name !== session.user.name) {
          return NextResponse.json(
            { error: "You can only edit your own messages" },
            { status: 403 }
          );
        }
        
        // Update message
        message.message = newText;
        message.edited = true;
        messageFound = true;
        
        // Broadcast edit
        await pubRedis.publish(
          "chat_messages",
          JSON.stringify({
            ...message,
            type: "message_edit",
          })
        );
      }
      
      updatedMessages.push(JSON.stringify(message));
    }
    
    if (!messageFound) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }
    
    // Delete all messages and reinsert the updated ones
    await redis.del(CHAT_HISTORY_KEY);
    if (updatedMessages.length > 0) {
      await redis.rpush(CHAT_HISTORY_KEY, ...updatedMessages);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { error: "Failed to edit message" },
      { status: 500 }
    );
  }
}