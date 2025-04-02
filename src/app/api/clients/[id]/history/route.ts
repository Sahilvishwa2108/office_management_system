import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for history entry creation
const historyEntrySchema = z.object({
  description: z.string().min(1, "Description is required"),
});

// GET - Fetch history entries for a specific client
export async function GET(
  _req: NextRequest, // Fixed: underscore for unused parameter
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = params.id;

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch all history entries for this client, ordered by most recent first
    const historyEntries = await prisma.clientHistory.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
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

    // Map response to match the expected format in the frontend
    const mappedEntries = historyEntries.map((entry: any) => ({
      id: entry.id,
      description: entry.content, // Map content field to description
      createdAt: entry.createdAt.toISOString(),
      createdBy: entry.createdBy,
    }));

    return NextResponse.json({ historyEntries: mappedEntries });
  } catch (error) {
    console.error("Error fetching client history:", error);
    return NextResponse.json(
      { error: "Failed to fetch client history" },
      { status: 500 }
    );
  }
}

// POST - Add a new history entry for a client
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = params.id;
    const userId = session.user.id;

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = historyEntrySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { description } = validationResult.data;

    // Create new history entry - using correct field name "content" instead of "description"
    const historyEntry = await prisma.clientHistory.create({
      data: {
        clientId,
        content: description, // FIXED: Use content field instead of description
        createdById: userId,
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

    // Format response to match expected structure in the frontend
    const formattedEntry = {
      id: historyEntry.id,
      description: historyEntry.content, // Map content to description for frontend
      createdAt: historyEntry.createdAt.toISOString(),
      createdBy: historyEntry.createdBy,
    };

    return NextResponse.json({
      message: "History entry added successfully",
      historyEntry: formattedEntry,
    });
  } catch (error) {
    console.error("Error adding client history entry:", error);
    return NextResponse.json(
      { error: "Failed to add history entry" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a history entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } } // Fixed: properly typed params
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "PARTNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the entry ID from the query parameter
    const entryId = req.nextUrl.searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    // Check if entry exists
    const entry = await prisma.clientHistory.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "History entry not found" },
        { status: 404 }
      );
    }

    // Delete the entry
    await prisma.clientHistory.delete({
      where: { id: entryId },
    });

    return NextResponse.json({
      message: "History entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting client history entry:", error);
    return NextResponse.json(
      { error: "Failed to delete history entry" },
      { status: 500 }
    );
  }
}

// Update history entry - Fixed implementation
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get client ID from params
    const clientId = params.id;

    // Parse request body to get entry ID and updated content
    const body = await req.json();
    const { entryId, content } = body;

    if (!entryId || !content) {
      return NextResponse.json(
        {
          error: "Entry ID and content are required",
        },
        { status: 400 }
      );
    }

    // Verify the entry exists and belongs to the specified client
    const existingEntry = await prisma.clientHistory.findFirst({
      where: {
        id: entryId,
        clientId: clientId,
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        {
          error: "History entry not found or doesn't belong to this client",
        },
        { status: 404 }
      );
    }

    // Update the history entry
    const updatedEntry = await prisma.clientHistory.update({
      where: { id: entryId },
      data: { content }, // Using content field which exists in schema
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Log the activity
    await prisma.activity.create({
      data: {
        type: "client",
        action: "updated history",
        target: `Client history entry for ${clientId}`,
        userId: session.user.id,
      },
    });

    // Format response to match expected structure in the frontend
    const formattedEntry = {
      id: updatedEntry.id,
      description: updatedEntry.content,
      createdAt: updatedEntry.createdAt.toISOString(),
      createdBy: updatedEntry.createdBy,
    };

    return NextResponse.json({
      message: "History entry updated successfully",
      historyEntry: formattedEntry,
    });
  } catch (error) {
    console.error("Error updating client history entry:", error);
    return NextResponse.json(
      { error: "Failed to update history entry" },
      { status: 500 }
    );
  }
}