import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    // Return early if no session exists or no user ID
    if (!session?.user?.id) {
      return NextResponse.json(
        { valid: false, message: "No active session or missing user ID" },
        { status: 401 }
      );
    }

    // Query the database for current user information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roleVersion: true, role: true }
    });

    // If user doesn't exist in database
    if (!user) {
      return NextResponse.json(
        { valid: false, message: "User not found" },
        { 
          status: 401,
          headers: {
            'X-Role-Changed': 'true'
          }
        }
      );
    }

    console.log("Session role version:", session.user.roleVersion, "DB role version:", user.roleVersion);
    console.log("Session role:", session.user.role, "DB role:", user.role);

    // Check if role version matches
    if (
      typeof session.user.roleVersion === 'undefined' || 
      user.roleVersion !== session.user.roleVersion || 
      user.role !== session.user.role
    ) {
      return NextResponse.json(
        { 
          valid: false, 
          message: "Role has changed",
          currentRole: user.role,
          sessionRole: session.user.role
        },
        { 
          status: 401,
          headers: {
            'X-Role-Changed': 'true'
          }
        }
      );
    }

    // Everything is valid
    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("[VALIDATE_ROLE_ERROR]", error);
    return NextResponse.json(
      { valid: false, message: "Error validating role" },
      { status: 500 }
    );
  }
}