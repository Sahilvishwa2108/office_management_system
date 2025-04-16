import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// This is the correct format for App Router dynamic route handlers
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has appropriate role
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user;
    
    // Await the params to satisfy Next.js
    const resolvedParams = await Promise.resolve(context.params);
    const userId = resolvedParams.id;

    // Only admins and partners can change user status
    if (role !== "ADMIN" && role !== "PARTNER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get request data
    const { isActive } = await req.json();

    // Get the user to update
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Partners can only update junior staff status
    if (role === "PARTNER") {
      if (
        userToUpdate.role !== "BUSINESS_EXECUTIVE" &&
        userToUpdate.role !== "BUSINESS_CONSULTANT"
      ) {
        return NextResponse.json(
          { error: "You can only update junior staff status" },
          { status: 403 }
        );
      }
    }

    // Update user status - ensure proper syntax
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: isActive }
      });
      
      console.log("User updated successfully:", updatedUser);
      
      return NextResponse.json({
        message: `User ${isActive ? 'activated' : 'blocked'} successfully`,
        isActive: updatedUser.isActive
      });
    } catch (error) {
      console.error("Database update error:", error);
      return NextResponse.json(
        { error: "Failed to update user status in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}
