import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redis } from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";

// Key for tracking online users
const ONLINE_USERS_KEY = "online_users";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { isOnline } = await req.json();
    
    if (typeof isOnline !== "boolean") {
      return NextResponse.json(
        { error: "isOnline must be a boolean" },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    const userName = session.user.name || "Unknown";
    const userRole = session.user.role || "GUEST";
    
    // Update user status in Redis
    if (isOnline) {
      await redis.hset(ONLINE_USERS_KEY, userId, JSON.stringify({
        lastSeen: new Date().toISOString(),
        name: userName,
        role: userRole
      }));
    } else {
      // Just update lastSeen time on logout, but don't remove from hash
      const userData = await redis.hget(ONLINE_USERS_KEY, userId);
      if (userData) {
        const parsed = JSON.parse(userData);
        await redis.hset(ONLINE_USERS_KEY, userId, JSON.stringify({
          ...parsed,
          lastSeen: new Date().toISOString()
        }));
      }
    }
    
    // Broadcast status change
    const statusMessage = {
      id: uuidv4(),
      type: "user_status",
      userId,
      name: userName,
      role: userRole,
      isOnline,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`,
      sentAt: new Date().toISOString()
    };
    
    await redis.publish("chat_messages", JSON.stringify(statusMessage));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}