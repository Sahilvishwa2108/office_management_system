import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordSetupEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "@/lib/activity-logger";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has appropriate role
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { role } = session.user;
    
    // Only admin can create all types of accounts
    // Partners can only create junior employee accounts
    if (role !== "ADMIN" && role !== "PARTNER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { name, email, assignedRole } = await req.json();

    // Validate inputs
    if (!name || !email || !assignedRole) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const normalizedEmail = email.toLowerCase().trim(); // Normalize email
    // Partners can only create BUSINESS_EXECUTIVE or BUSINESS_CONSULTANT roles
    if (
      role === "PARTNER" && 
      (assignedRole === "ADMIN" || assignedRole === "PARTNER")
    ) {
      return NextResponse.json(
        { error: "You can only create junior employee accounts" },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Generate a unique token for password setup
    const passwordToken = uuidv4();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hour expiry

    // Create default password - THIS IS THE KEY CHANGE
    const defaultPassword = "12345678";
    const hashedPassword = await hash(defaultPassword, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        role: assignedRole,
        isActive: true, // Explicitly set this
        password: hashedPassword,
        passwordResetToken: passwordToken,
        passwordResetTokenExpiry: tokenExpiry,
      },
    });

    // Send email with password setup link
    await sendPasswordSetupEmail(normalizedEmail, name, passwordToken, user.id);

    // Log the activity
    await logActivity(
      "user",
      "created",
      user.name, 
      session.user.id,
      { 
        userId: user.id, 
        role: user.role 
      }
    );

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// Get all users (with filtering based on role)
export async function GET(request: NextRequest) {
  try {
    // Get session and check authorization
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get search parameters
    const { searchParams } = new URL(request.url);
    
    // Get multiple roles if provided (comma-separated)
    const rolesParam = searchParams.get("roles");
    const roles = rolesParam ? rolesParam.split(",") : [];
    
    // Get status filter
    const status = searchParams.get("status");

    // Build where clause
    const where: Record<string, unknown> = {};
    
    // Apply role filter - if multiple roles are specified
    if (roles.length > 0) {
      // Ensure we only use valid role values that match UserRole enum
      where.role = { in: roles };
    }
    
    // Apply status filter
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Rest of your user fetching logic...
    const users = await prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            taskAssignments: true // Count taskAssignments instead
          }
        }
      },
    });

    // Map the response to include assignedTasksCount

    const totalCount = users.length;
    
    return NextResponse.json({
      users: users.map(user => ({
        ...user,
        assignedTaskCount: user._count.taskAssignments // Use the new field name
      })),
      totalCount
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}