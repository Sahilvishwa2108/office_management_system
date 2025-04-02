import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Get user profile
export async function GET(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get the user with valid relations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        // Only include relations that exist in the schema
        assignedTasks: true,
        createdTasks: true,
        managedClients: true,
        notificationsReceived: {
          where: {
            isRead: false
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Transform the user data as needed for the frontend
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      managedClients: user.managedClients,
      assignedTasks: user.assignedTasks,
      createdTasks: user.createdTasks,
      unreadNotifications: user.notificationsReceived.length
    };
    
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone } = await request.json();
    const userId = session.user.id;

    // Update user data
    const userData: any = { name };
    if (session.user.role === "ADMIN" && email) {
      userData.email = email;
    }
    if (phone !== undefined) {
      userData.phone = phone; // Updated to include phone field in User model
    }

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}