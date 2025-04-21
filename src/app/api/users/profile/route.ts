import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications"; // Adjust the path as needed

// Get user profile
export async function GET() {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get the user with valid relations using the new schema
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        // Use the new many-to-many relationship
        taskAssignments: {
          include: {
            task: true
          }
        },
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
    
    // Transform the user data to maintain the same API contract for the frontend
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      managedClients: user.managedClients,
      
      // Convert taskAssignments to the format expected by the frontend
      assignedTasks: user.taskAssignments.map(assignment => assignment.task),
      
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

    // Fetch the current user data
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedFields: string[] = [];

    // Check for changes and update fields
    if (name && name !== userToUpdate.name) {
      updatedFields.push(`Name changed from "${userToUpdate.name}" to "${name}"`);
    }
    if (email && email !== userToUpdate.email) {
      updatedFields.push(`Email changed from "${userToUpdate.email}" to "${email}"`);
    }
    if (phone && phone !== userToUpdate.phone) {
      updatedFields.push(`Phone number changed from "${userToUpdate.phone}" to "${phone}"`);
    }

    // Update user data
    const userData: { name: string; email?: string; phone?: string } = { name };
    if (email) {
      userData.email = email;
    }
    if (phone !== undefined) {
      userData.phone = phone;
    }

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    // Send notifications
    if (updatedFields.length > 0) {
      const notificationTitle = "Your profile was updated";
      const notificationContent = updatedFields.join(", ");

      // In-app notification
      await createNotification({
        title: notificationTitle,
        content: notificationContent,
        sentById: userId,
        sentToId: userId,
        sendEmail: true,
        emailSubject: notificationTitle,
        emailHtml: `<p>${notificationContent}</p>`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}