import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type"); // Optional filter by activity type
    const action = searchParams.get("action"); // Optional filter by action
    const userId = searchParams.get("userId"); // Optional filter by user
    const forCurrentUser = searchParams.get("forCurrentUser") === "true";
    const includeLoginLogout = searchParams.get("includeLoginLogout") === "true"; // New parameter
    
    // Default pagination to prevent massive queries
    const take = Math.min(limit, 100);

    // Build the where clause dynamically
    const where: any = {
      // Default: exclude login/logout actions unless explicitly requested
      action: includeLoginLogout ? undefined : { notIn: ["login", "logout"] }
    };
    
    if (type) {
      where.type = type;
    }
    
    if (action) {
      // If specific action is requested, override the default exclusion
      where.action = action;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (forCurrentUser) {
      where.userId = session.user.id;
    }

    // Retrieve activities
    const activities = await prisma.activity.findMany({
      where,
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Transform activities for frontend consumption
    const transformedActivities = activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      user: {
        id: activity.user.id,
        name: activity.user.name,
        role: activity.user.role,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${activity.user.name}`,
      },
      action: activity.action,
      target: activity.target,
      details: activity.details,
      timestamp: activity.createdAt.toISOString(),
    }));

    return NextResponse.json(transformedActivities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}