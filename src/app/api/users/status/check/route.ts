import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Add underscore to indicate intentional non-use
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ isBlocked: false });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isActive: true }
    });
    
    if (!user) {
      return NextResponse.json({ isBlocked: true });
    }
    
    return NextResponse.json({ isBlocked: user.isActive === false });
  } catch (error) {
    console.error("Error checking user status:", error);
    return NextResponse.json({ isBlocked: false });
  }
}