import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordSetupEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { v4 as uuidv4 } from "uuid";

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
      where: { email },
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

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: assignedRole,
        isActive: true, // Explicitly set this
        passwordResetToken: passwordToken,
        passwordResetTokenExpiry: tokenExpiry,
      },
    });

    // Send email with password setup link
    await sendPasswordSetupEmail(email, name, passwordToken);

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
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { role } = session.user;
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");
    
    // Prepare filter based on user role
    let where: any = {};
    
    // Apply role filter if provided
    if (roleFilter) {
      where.role = roleFilter;
    }
    
    // Partners can only see junior employees
    if (role === "PARTNER") {
      where.role = {
        in: ["BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"]
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true, // Include isActive field
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc"
      }
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