import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params; // Await params if it's a Promise
    const clientId = resolvedParams.id;
    
    // Validate that the client exists (this would be using clientId)
    const clientExists = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true }
    });
    
    if (!clientExists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get history entries for this client
    const historyEntries = await prisma.clientHistory.findMany({
      where: {
        clientId,
        type: "general",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ historyEntries });
  } catch (error) {
    console.error("Error fetching client history:", error);
    return NextResponse.json(
      { error: "Failed to fetch client history" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add role-based access control
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can add history entries" },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const clientId = resolvedParams.id;
    const body = await request.json();

    // Validate required fields
    if (!body.description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Create history entry
    const historyEntry = await prisma.clientHistory.create({
      data: {
        content: body.description,
        type: "general",
        clientId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ historyEntry }, { status: 201 });
  } catch (error) {
    console.error("Error creating history entry:", error);
    return NextResponse.json(
      { error: "Failed to create history entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can delete history entries" },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const clientId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    // Check if entry exists and belongs to the client
    const entry = await prisma.clientHistory.findFirst({
      where: {
        id: entryId,
        clientId,
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "History entry not found" },
        { status: 404 }
      );
    }

    // Delete the entry
    await prisma.clientHistory.delete({
      where: {
        id: entryId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting history entry:", error);
    return NextResponse.json(
      { error: "Failed to delete history entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Fix: Resolve params if it's a Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const clientId = resolvedParams.id;
    
    const body = await request.json();
    const { entryId, pinned } = body;

    if (!entryId || typeof pinned !== "boolean") {
      return NextResponse.json(
        { error: "Entry ID and pinned status are required" },
        { status: 400 }
      );
    }

    // Update the pinned status
    const updatedEntry = await prisma.clientHistory.update({
      where: { id: entryId },
      data: { pinned },
    });

    return NextResponse.json({ updatedEntry });
  } catch (error) {
    console.error("Error updating history entry:", error);
    return NextResponse.json(
      { error: "Failed to update history entry" },
      { status: 500 }
    );
  }
}