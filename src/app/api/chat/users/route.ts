import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

// Key for tracking online users
const ONLINE_USERS_KEY = "online_users";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get all active users from database
    const dbUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
      }
    });
    
    // Get online status from Redis
    const onlineStatus = await redis.hgetall(ONLINE_USERS_KEY);
    
    // Combine data
    const users = dbUsers.map(user => {
      const status = onlineStatus[user.id] 
        ? JSON.parse(onlineStatus[user.id])
        : { lastSeen: null };
        
      // Check if user has been active in the last 2 minutes
      const lastSeen = status.lastSeen ? new Date(status.lastSeen) : null;
      const isOnline = lastSeen && 
        ((new Date().getTime() - lastSeen.getTime()) < 2 * 60 * 1000);
      
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`,
        isOnline,
        lastSeen: status.lastSeen
      };
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}