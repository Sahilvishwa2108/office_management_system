import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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