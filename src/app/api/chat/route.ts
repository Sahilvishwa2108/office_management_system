// import { NextRequest, NextResponse } from "next/server";
// import { redis, pubSubRedis } from "@/lib/redis";
// import { v4 as uuidv4 } from "uuid";

// type Message = {
//   id: string;
//   name: string;
//   role: string;
//   message: string;
//   sentAt: string;
// };

// const CHAT_HISTORY_KEY = "group_chat"; // Redis list key
// const MAX_CHAT_HISTORY = 500; // Store only the last 500 messages

// // ✅ Handle POST request to send a message
// export async function POST(req: NextRequest) {
//   try {
//     const { name, role, message } = await req.json();

//     if (!name || !role || !message) {
//       return NextResponse.json({ error: "All fields are required" }, { status: 400 });
//     }

//     const newMessage: Message = {
//       id: uuidv4(),
//       name,
//       role,
//       message,
//       sentAt: new Date().toISOString(),
//     };

//     // Store in Redis list (LPUSH) and trim to keep only the last 50 messages
//     await redis.lpush(CHAT_HISTORY_KEY, JSON.stringify(newMessage));
//     await redis.ltrim(CHAT_HISTORY_KEY, 0, MAX_CHAT_HISTORY - 1);

//     // Publish message for real-time updates
//     // yaha hai dikkattttttttttttttttttt
//     await pubSubRedis.publish("chat_messages", JSON.stringify(newMessage));

//     return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
//   } catch (error) {
//     console.log("Error sending message:", error);
//     return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
//   }
// }

// // ✅ Handle GET request to retrieve messages
// export async function GET() {
//   try {
//     // Fetch last 50 messages from Redis
//     const messages = await redis.lrange(CHAT_HISTORY_KEY, 0, -1);
//     const parsedMessages: Message[] = messages.map((msg) => JSON.parse(msg));

//     return NextResponse.json(parsedMessages, { status: 200 });
//   } catch (error) {
//     return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
//   }
// }











//////////////////////////////////////////////////



import { NextRequest, NextResponse } from "next/server";
import { redis, pubRedis } from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";

type Message = {
  id: string;
  name: string;
  role: string;
  message: string;
  sentAt: string;
};

const CHAT_HISTORY_KEY = "group_chat"; // Redis list key
const MAX_CHAT_HISTORY = 500; // Store only the last 500 messages

// ✅ Handle POST request to send a message
export async function POST(req: NextRequest) {
  try {
    const { name, role, message } = await req.json();

    if (!name || !role || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const newMessage: Message = {
      id: uuidv4(),
      name,
      role,
      message,
      sentAt: new Date().toISOString(),
    };

    // Store in Redis list (LPUSH) and trim to keep only the last 50 messages
    await redis.lpush(CHAT_HISTORY_KEY, JSON.stringify(newMessage));
    await redis.ltrim(CHAT_HISTORY_KEY, 0, MAX_CHAT_HISTORY - 1);

    // Publish message for real-time updates
    // yaha hai dikkattttttttttttttttttt
    await pubRedis.publish("chat_messages", JSON.stringify(newMessage));

    return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
  } catch (error) {
    console.log("Error sending message:", error);
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
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
