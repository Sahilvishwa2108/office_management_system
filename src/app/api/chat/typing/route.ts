import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isTyping } = await req.json();
    
    // Broadcast typing status to all clients
    await redis.publish("chat:updates", JSON.stringify({
      type: "typing_indicator",
      userId: session.user.id,
      name: session.user.name,
      isTyping
    }));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating typing status:", error);
    return NextResponse.json(
      { error: "Failed to update typing status" },
      { status: 500 }
    );
  }
}