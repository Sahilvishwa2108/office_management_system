import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Client update validation schema
const clientUpdateSchema = z.object({
  contactPerson: z.string().optional(),
  companyName: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  isGuest: z.boolean().optional(),
  accessExpiry: z.string().optional().nullable(),
});

// GET specific client - keep accessible to all authenticated users
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fix: Await params before accessing id
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PATCH update client - restrict to Admin only
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add role-based access control
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can update clients" },
        { status: 403 }
      );
    }

    // Fix: Access id safely from params object 
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    // Get the existing client
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const data = await req.json();
    
    // Validate client data
    const validationResult = clientUpdateSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid client data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Make sure at least one contact method exists after the update
    const willHaveEmail = data.email !== undefined ? data.email : existingClient.email;
    const willHavePhone = data.phone !== undefined ? data.phone : existingClient.phone;

    if (!willHaveEmail && !willHavePhone) {
      return NextResponse.json(
        { error: "At least one contact method (email or phone) is required" },
        { status: 400 }
      );
    }

    // Handle the potential date string to Date conversion
    let accessExpiry: Date | null | undefined = undefined;
    if (data.accessExpiry === null) {
      accessExpiry = null;
    } else if (data.accessExpiry) {
      accessExpiry = new Date(data.accessExpiry);
    }

    // Update client data
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        contactPerson: data.contactPerson,
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        gstin: data.gstin,
        isGuest: data.isGuest,
        accessExpiry,
      },
    });

    // Log the activity
    await prisma.activity.create({
      data: {
        type: "client",
        action: "updated",
        target: updatedClient.contactPerson,
        userId: session.user.id,
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE client - restrict to Admin only
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add role-based access control
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can delete clients" },
        { status: 403 }
      );
    }

    // Fix: Access id safely from params object
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    // Get client name for activity log
    const client = await prisma.client.findUnique({
      where: { id },
      select: { contactPerson: true, isGuest: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Delete the client (cascading deletion will happen if defined in schema)
    await prisma.client.delete({
      where: { id },
    });

    // Log the activity
    await prisma.activity.create({
      data: {
        type: "client",
        action: "deleted",
        target: `${client.isGuest ? "Guest" : "Permanent"} client: ${client.contactPerson}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}