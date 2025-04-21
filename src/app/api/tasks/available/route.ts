import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskStatus, BillingStatus, TaskPriority } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get search params for filtering
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    
    // Define filters based on role - apply RBAC
    // Initialize with proper type instead of empty array
    let availableTasks: Array<{
      id: string;
      title: string;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate: Date | null;
      billingStatus: BillingStatus | null;
    }> = [];
    
    // Create a properly typed status filter
    const statusFilter = statusParam ? 
      { status: statusParam as TaskStatus } : 
      { status: { notIn: ["completed", "cancelled"] as TaskStatus[] } };
    
    if (session.user.role === "ADMIN") {
      // Admins can assign any task
      availableTasks = await prisma.task.findMany({
        where: {
          // Tasks that are not completed or billed
          ...statusFilter,
          billingStatus: { not: "billed" as BillingStatus },
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          billingStatus: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50, // Limit to 50 most recent tasks
      });
    } else if (session.user.role === "PARTNER") {
      // Partners can only assign tasks they created
      availableTasks = await prisma.task.findMany({
        where: {
          // Tasks created by this partner
          assignedById: session.user.id,
          // Tasks that are not completed or billed
          ...statusFilter,
          billingStatus: { not: "billed" as BillingStatus },
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          billingStatus: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50, // Limit to 50 most recent tasks
      });
    }
    
    return NextResponse.json(availableTasks);
  } catch (error) {
    console.error("Error fetching available tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch available tasks" },
      { status: 500 }
    );
  }
}