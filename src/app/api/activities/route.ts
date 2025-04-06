import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Fetch activities with different filtering based on role
    let whereCondition = {};
    
    // Admin can see all activities
    if (currentUser.role !== "ADMIN") {
      if (currentUser.role === "PARTNER") {
        // Partners can see their own activities and activities of users they manage
        const managedUsers = await prisma.user.findMany({
          where: {
            OR: [
              { role: "BUSINESS_EXECUTIVE" },
              { role: "BUSINESS_CONSULTANT" }
            ]
          },
          select: { id: true }
        });
        
        const managedUserIds = managedUsers.map(user => user.id);
        
        whereCondition = {
          OR: [
            { userId: currentUser.id },
            { userId: { in: managedUserIds } }
          ]
        };
      } else {
        // Junior staff can only see their own activities
        whereCondition = { userId: currentUser.id };
      }
    }

    // Fetch activities
    const activities = await prisma.activity.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Count total for pagination
    const total = await prisma.activity.count({
      where: whereCondition,
    });

    // Limit total activities to 20 to save database storage
    const totalActivities = await prisma.activity.count();
    if (totalActivities > 20) {
      // Get IDs of oldest activities to delete
      const activitiesToDelete = await prisma.activity.findMany({
        orderBy: {
          createdAt: "asc",
        },
        take: totalActivities - 20,
        select: {
          id: true,
        },
      });
      
      // Delete oldest activities
      if (activitiesToDelete.length > 0) {
        await prisma.activity.deleteMany({
          where: {
            id: {
              in: activitiesToDelete.map(activity => activity.id),
            },
          },
        });
      }
    }

    return NextResponse.json({
      data: activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}