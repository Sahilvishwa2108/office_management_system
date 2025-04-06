import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const type = searchParams.get("type"); // Allow filtering by type

    // Define public activity types and actions
    const publicActivities = {
      user: ["created", "deleted", "role_changed", "updated", "name_updated", "phone_updated"],
      client: ["created", "deleted", "updated"],
      system: ["announcement", "maintenance", "update"]
    };

    // Exclude non-public activities
    const excludedTypes = ["task", "login", "logout", "message"];
    
    // Build the where condition with proper filtering
    let where: any = {
      OR: [
        { type: "user", action: { in: publicActivities.user } },
        { type: "client", action: { in: publicActivities.client } },
        { type: "system", action: { in: publicActivities.system } }
      ],
      NOT: [
        { type: { in: excludedTypes } }
      ]
    };

    // Add type filter if specified
    if (type && (type === "user" || type === "client" || type === "system")) {
      where = {
        type,
        action: { in: publicActivities[type as keyof typeof publicActivities] },
        NOT: [
          { type: { in: excludedTypes } }
        ]
      };
    }

    // Fetch activities with proper filtering
    const activities = await prisma.activity.findMany({
      where,
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
      skip,
      take: limit,
    });

    // Count total activities for pagination
    const totalCount = await prisma.activity.count({
      where,
    });

    // Format the response
    return NextResponse.json({
      data: activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        action: activity.action,
        target: activity.target,
        timestamp: activity.createdAt,
        user: {
          name: activity.user.name,
          role: activity.user.role,
        },
        details: activity.details,
      })),
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching public activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}