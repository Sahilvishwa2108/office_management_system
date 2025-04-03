import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redis, pubRedis } from "@/lib/redis";

const CHAT_HISTORY_KEY = "group_chat";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { messageId } = await req.json();
    
    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }
    
    // Get all messages
    const messages = await redis.lrange(CHAT_HISTORY_KEY, 0, -1);
    const remainingMessages = [];
    let messageFound = false;
    let deletedMessage = null;
    
    for (const messageStr of messages) {
      const message = JSON.parse(messageStr);
      
      if (message.id === messageId) {
        // Verify user is deleting their own message
        if (message.name !== session.user.name) {
          return NextResponse.json(
            { error: "You can only delete your own messages" },
            { status: 403 }
          );
        }
        
        messageFound = true;
        deletedMessage = message;
      } else {
        remainingMessages.push(messageStr);
      }
    }
    
    if (!messageFound) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }
    
    // Delete all messages and reinsert the remaining ones
    await redis.del(CHAT_HISTORY_KEY);
    if (remainingMessages.length > 0) {
      await redis.rpush(CHAT_HISTORY_KEY, ...remainingMessages);
    }
    
    // Broadcast deletion
    await pubRedis.publish(
      "chat_messages",
      JSON.stringify({
        id: messageId,
        type: "message_delete",
        deletedBy: session.user.name,
      })
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}