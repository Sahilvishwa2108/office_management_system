import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserRole, requireRole } from "@/lib/auth";
import { UserRole } from "@/lib/prisma-types";
import { z } from "zod";

// Create a validation schema
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum([
    "ADMIN",
    "PARTNER",
    "BUSINESS_EXECUTIVE",
    "BUSINESS_CONSULTANT",
    "PERMANENT_CLIENT",
    "GUEST_CLIENT",
  ]),
  clerkId: z.string().optional(),
});

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only ADMIN and PARTNER can list all users
  const roleCheck = await requireRole("PARTNER" as UserRole);
  if (roleCheck) return roleCheck;

  try {
    const users = await prisma.user.findMany({
      include: {
        clientInfo: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, role, clerkId } = body;

    // Check if user already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { clerkId },
        data: { name, email, role },
      });

      return NextResponse.json(updatedUser);
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          role,
          clerkId,
        },
      });

      return NextResponse.json(newUser, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json({ error: "Failed to create/update user" }, { status: 500 });
  }
}