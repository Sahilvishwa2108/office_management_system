import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Client validation schema
const clientSchema = z.object({
  contactPerson: z.string().min(1, "Contact person name is required"),
  companyName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal('')), // Allow empty string
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isGuest: z.boolean().default(false),
  accessExpiry: z.string().nullable().optional(),
});

// GET all clients
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse URL search params
    const searchParams = req.nextUrl.searchParams;
    const isGuest = searchParams.get("isGuest");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: any = {};
    
    // Filter by guest status if provided
    if (isGuest === "true") {
      where.isGuest = true;
    } else if (isGuest === "false") {
      where.isGuest = false;
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { contactPerson: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.client.count({ where });

    // Get clients with pagination
    const clients = await prisma.client.findMany({
      where,
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
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: limit,
    });

    // Process clients for response with data validation
    const processedClients = clients.map((client) => {
      const activeTasks = client.tasks?.filter(task => 
        task.status !== "completed" && task.status !== "cancelled"
      ).length || 0;
      
      const completedTasks = client.tasks?.filter(task => 
        task.status === "completed"
      ).length || 0;

      return {
        id: client.id,
        // Ensure contactPerson is never null or undefined
        contactPerson: client.contactPerson || "Unnamed Client", 
        companyName: client.companyName || null,
        email: client.email || null,
        phone: client.phone || null,
        isGuest: Boolean(client.isGuest),
        accessExpiry: client.accessExpiry,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        activeTasks,
        completedTasks,
      };
    });

    return NextResponse.json({
      clients: processedClients,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST create new client
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only certain roles can create clients
    if (!["ADMIN", "PARTNER", "BUSINESS_EXECUTIVE"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const data = await req.json();
    
    // Validate client data
    const validationResult = clientSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid client data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const clientData = validationResult.data;

    // For guest clients, ensure expiry date is set
    if (clientData.isGuest && !clientData.accessExpiry) {
      // Default to 30 days expiry if not specified
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
      clientData.accessExpiry = expiryDate.toISOString();
    }

    // Ensure at least one contact method is provided
    if (!clientData.email && !clientData.phone) {
      return NextResponse.json(
        { error: "At least one contact method (email or phone) is required" },
        { status: 400 }
      );
    }

    // Create the client
    const newClient = await prisma.client.create({
      data: {
        contactPerson: clientData.contactPerson,
        companyName: clientData.companyName,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        notes: clientData.notes,
        isGuest: clientData.isGuest || false,
        accessExpiry: clientData.accessExpiry ? new Date(clientData.accessExpiry) : null,
        managerId: session.user.id,
      },
    });

    // Log the activity
    await prisma.activity.create({
      data: {
        type: "client",
        action: "created",
        target: `${clientData.isGuest ? "Guest" : "Permanent"} client: ${clientData.contactPerson}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}