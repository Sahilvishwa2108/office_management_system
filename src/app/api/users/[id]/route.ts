import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createNotification } from "@/lib/notifications";

// Schema for user update validation
const userUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z
    .enum([
      "ADMIN",
      "PARTNER",
      "BUSINESS_EXECUTIVE",
      "JUNIOR_EXECUTIVE",
      "ACCOUNTANT",
    ])
    .optional(),
  // Other fields...
});

// Get specific user
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has appropriate role
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user;

    // Fix: Await the params object before accessing id
    const { id: userId } = await Promise.resolve(params);

    // Admins can view any user, partners can only view junior staff
    if (role !== "ADMIN" && role !== "PARTNER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true, // Ensure avatar is included
        isActive: true,
        createdAt: true,
        updatedAt: true,
        taskAssignments: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Partners can only view junior staff (BUSINESS_EXECUTIVE or BUSINESS_CONSULTANT)
    if (
      role === "PARTNER" &&
      user.role !== "BUSINESS_EXECUTIVE" &&
      user.role !== "BUSINESS_CONSULTANT"
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Return user data without sensitive information
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      assignedTasks: user.taskAssignments.map(assignment => assignment.task), // Include assigned tasks in the response
    });
  } catch (error) {
    console.error("Error getting user:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}

// Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has appropriate role
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user;

    // Fix: Await the params object before accessing id
    const { id: userId } = await Promise.resolve(params);

    // Only admins and partners can update users
    if (role !== "ADMIN" && role !== "PARTNER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get request data
    const { name, email, role: newRole, phone, password } = await req.json();
    const normalizedEmail = email?.toLowerCase().trim();

    // Get the user to update
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Partners can only update junior staff and can't change their role to ADMIN or PARTNER
    if (role === "PARTNER") {
      if (
        userToUpdate.role !== "BUSINESS_EXECUTIVE" &&
        userToUpdate.role !== "BUSINESS_CONSULTANT"
      ) {
        return NextResponse.json(
          { error: "You can only update junior staff" },
          { status: 403 }
        );
      }

      if (newRole === "ADMIN" || newRole === "PARTNER") {
        return NextResponse.json(
          { error: "You cannot promote users to Admin or Partner roles" },
          { status: 403 }
        );
      }
    }

    // Check if email is already in use by another user
    if (normalizedEmail && normalizedEmail !== userToUpdate.email) {
      // Check if the email is already in use by another user
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    }

    const updatedFields: string[] = [];
    const updatedById = session.user.id;

    // Check for changes and update fields
    if (name && name !== userToUpdate.name) {
      updatedFields.push(
        `Name changed from "${userToUpdate.name}" to "${name}"`
      );
    }
    if (email && email !== userToUpdate.email) {
      updatedFields.push(
        `Email changed from "${userToUpdate.email}" to "${email}"`
      );
    }
    if (typeof newRole !== "undefined" && newRole !== userToUpdate.role) {
      updatedFields.push(
        `Role changed from "${userToUpdate.role}" to "${newRole}". Please log out and log back in to see the changes.`
      );
    }
    if (phone && phone !== userToUpdate.phone) {
      updatedFields.push(
        `Phone number changed from "${userToUpdate.phone}" to "${phone}"`
      );
    }
    if (password) {
      updatedFields.push("Password was updated");
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email: normalizedEmail,
        role: newRole,
        phone,
        password: password ? await bcrypt.hash(password, 10) : undefined,
        updatedById,
      },
    });

    // Send notifications
    const isSelfUpdate = updatedById === userId;
    const updaterName = isSelfUpdate ? "You" : session.user.name;

    const notificationTitle = isSelfUpdate
      ? "Your profile was updated"
      : `${updaterName} updated your profile`;

    const notificationContent = updatedFields.join(", ");

    // In-app notification
    await createNotification({
      title: notificationTitle,
      content: notificationContent,
      sentById: updatedById,
      sentToId: userId,
      sendEmail: true,
      emailSubject: notificationTitle,
      emailHtml: `<p>${notificationContent}</p>`,
    });

    // Log activity for role change
    if (newRole && newRole !== userToUpdate.role) {
      await logActivity(
        "user",
        "role_changed",
        `${userToUpdate.name} from ${userToUpdate.role} to ${newRole}`,
        session.user.id,
        {
          userId: userId,
          oldRole: userToUpdate.role,
          newRole: newRole,
          relatedUserIds: [userId], // This is critical! Include the affected user's ID
        }
      );
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has appropriate role
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user;

    // Fix: Await the params object before accessing id
    const { id: userId } = await Promise.resolve(params);

    // Only admins can delete users
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete all associations in the correct order to avoid foreign key constraint errors

    // 1. Delete notifications where user is recipient
    await prisma.notification.deleteMany({
      where: { sentToId: userId },
    });

    // 2. Delete notifications where user is sender
    await prisma.notification.deleteMany({
      where: { sentById: userId },
    });

    // 3. Delete activities by this user
    await prisma.activity.deleteMany({
      where: { userId: userId },
    });

    // 4. Delete task comments by this user
    await prisma.taskComment.deleteMany({
      where: { userId: userId },
    });

    // 5. Delete messages sent by this user
    await prisma.message.deleteMany({
      where: { senderId: userId },
    });

    // 6. Handle tasks
    // First, update tasks assigned to this user (set assignedToId to null)
    await prisma.taskAssignee.deleteMany({
      where: { userId: userId }
    });

    // 7. Reassign tasks created by this user to the admin (current user) instead of deleting them
    await prisma.task.updateMany({
      where: { assignedById: userId },
      data: { assignedById: session.user.id },
    });

    // 8. Reassign clients managed by this user to the admin
    await prisma.client.updateMany({
      where: { managerId: userId },
      data: { managerId: session.user.id },
    });

    // Now we can safely delete the user
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });

    await logActivity("user", "deleted", deletedUser.name, session.user.id, {
      userId: deletedUser.id,
      userEmail: deletedUser.email,
    });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

// Patch user
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and partners can update users
    if (!["ADMIN", "PARTNER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const id = params.id;
    const data = await req.json();

    // Validate the incoming data
    const validationResult = userUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid data format",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    // Get the existing user to check for changes
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Special handling for role changes
    if (data.role && existingUser.role !== data.role) {
      // Ensure admin role can only be granted by existing admins
      if (data.role === "ADMIN" && session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only administrators can create admin accounts" },
          { status: 403 }
        );
      }

      // Log the role change explicitly to ensure it's captured
      console.log(
        `Role change for user ${existingUser.name}: ${existingUser.role} -> ${data.role}`
      );

      // Log the activity with clear distinguishing details
      await logActivity(
        "user",
        "role_changed",
        `${existingUser.name} (${existingUser.role} → ${data.role})`,
        session.user.id,
        {
          userId: existingUser.id,
          previousRole: existingUser.role,
          newRole: data.role,
          timestamp: new Date().toISOString(),
        }
      );
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        // Include roleVersion increment only when role changes
        ...(data.role && existingUser.role !== data.role
          ? { roleVersion: { increment: 1 } }
          : {}),
        // Other fields remain unchanged
      },
    });

    // Log general update activity if no role change occurred
    if (!(data.role && existingUser.role !== data.role)) {
      await logActivity("user", "updated", existingUser.name, session.user.id, {
        userId: existingUser.id,
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
