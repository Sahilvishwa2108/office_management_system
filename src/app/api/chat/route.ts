import { NextRequest, NextResponse } from "next/server";
import { redis, pubRedis } from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";

// Update the Message type to include attachments
type Message = {
  id: string;
  name: string;
  role: string;
  message: string;
  sentAt: string;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    type: string;
    size: number;
  }>;
};

const CHAT_HISTORY_KEY = "group_chat";
const MAX_CHAT_HISTORY = 500;

// ✅ Handle POST request to send a message
export async function POST(req: NextRequest) {
  try {
    // Update this to destructure attachments as well
    const { name, role, message, attachments, id } = await req.json();

    if (!name || !role) {
      return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
    }

    // Allow empty message if attachments exist
    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: "Message or attachments required" }, { status: 400 });
    }

    const newMessage: Message = {
      id: id || uuidv4(),
      name,
      role,
      message,
      sentAt: new Date().toISOString(),
      attachments // Include attachments in the stored message
    };

    // Store in Redis list and trim
    await redis.lpush(CHAT_HISTORY_KEY, JSON.stringify(newMessage));
    await redis.ltrim(CHAT_HISTORY_KEY, 0, MAX_CHAT_HISTORY - 1);

    // Publish message for real-time updates
    await pubRedis.publish("chat_messages", JSON.stringify(newMessage));

    return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ✅ Handle GET request to retrieve messages
export async function GET() {
  try {
    // Fetch last 50 messages from Redis
    const messages = await redis.lrange(CHAT_HISTORY_KEY, 0, -1);
    const parsedMessages: Message[] = messages.map((msg) => JSON.parse(msg));

    return NextResponse.json(parsedMessages, { status: 200 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
