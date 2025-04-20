import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redis } from "@/lib/redis";

const ONLINE_USERS_KEY = "online_users";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { isOnline } = body;

    if (typeof isOnline !== "boolean") {
      return NextResponse.json(
        { error: "isOnline must be a boolean" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const userName = session.user.name || "Unknown";
    const userRole = session.user.role || "GUEST";

    if (isOnline) {
      // Mark user as online
      await redis.hset(ONLINE_USERS_KEY, userId, JSON.stringify({
        lastSeen: new Date().toISOString(),
        name: userName,
        role: userRole,
      }));
    } else {
      // Mark user as offline
      await redis.hdel(ONLINE_USERS_KEY, userId);
    }

    // Broadcast status change
    await redis.publish("chat_messages", JSON.stringify({
      type: "user_status",
      userId,
      name: userName,
      role: userRole,
      isOnline,
      sentAt: new Date().toISOString(),
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}