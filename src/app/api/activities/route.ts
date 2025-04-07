import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache"; // Using unstable_cache for data caching

// Cache the activity fetch for 30 seconds
const getCachedActivities = unstable_cache(
  async (params: { limit: number, page: number, type: string | null, where: any }) => {
    const { limit, page, where } = params;
    const skip = (page - 1) * limit;
    
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
    
    const totalCount = await prisma.activity.count({
      where,
    });
    
    return { activities, totalCount };
  },
  ["activities"],
  { revalidate: 30 } // Cache for 30 seconds
);

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
    const type = searchParams.get("type");

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

    // Fetch activities with caching
    const { activities, totalCount } = await getCachedActivities({
      limit,
      page,
      type,
      where
    });

    // Format the response
    return NextResponse.json({
      data: activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        action: activity.action,
        target: activity.target,
        timestamp: activity.createdAt,
        user: activity.user ? {
          name: activity.user.name,
          role: activity.user.role,
        } : undefined,
        details: activity.details,
      })),
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    }, {
      headers: {
        // Add caching headers
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59',
      }
    });
  } catch (error) {
    console.error("Error fetching public activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}