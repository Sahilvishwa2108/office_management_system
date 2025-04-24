import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params; // Await params if it's a Promise
    const { id: clientId } = resolvedParams;

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get task history entries for this client from ClientHistory
    const taskHistory = await prisma.clientHistory.findMany({
      where: { 
        clientId,
        taskId: { not: null } 
      },
      orderBy: { 
        taskCompletedDate: "desc" 
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ taskHistory });
  } catch (error) {
    console.error("Error fetching client task history:", error);
    return NextResponse.json(
      { error: "Failed to fetch client task history" },
      { status: 500 }
    );
  }
}