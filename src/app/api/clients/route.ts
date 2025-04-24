import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  gstin: z.string().optional(),
  isGuest: z.boolean().default(false),
  accessExpiry: z.string().nullable().optional(),
});

// GET all clients
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const searchTerm = searchParams.get('search') || '';
    const isGuestParam = searchParams.get('isGuest');
    const isGuest = isGuestParam === 'true' ? true : isGuestParam === 'false' ? false : undefined;
    
    // Calculate pagination values
    const skip = (page - 1) * limit;
    
    // Build the where clause based on filters
    const where: any = {};
    
    // Filter by isGuest if specified
    if (isGuest !== undefined) {
      where.isGuest = isGuest;
    }
    
    // Add search filter if provided
    if (searchTerm) {
      where.OR = [
        { contactPerson: { contains: searchTerm, mode: 'insensitive' } },
        { companyName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    // Execute the queries
    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          tasks: {
            where: {
              status: { not: 'completed' }
            }
          }
        }
      }),
      prisma.client.count({ where })
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    // Prepare the response with data and pagination info
    const response = {
      clients: clients.map(client => ({
        ...client,
        activeTasks: client.tasks.length,
        completedTasks: 0, // You could count these if needed
      })),
      pagination: {
        total: totalCount,
        pages: totalPages,
        page,
        limit
      }
    };
    
    // Create the response with appropriate cache headers
    const res = NextResponse.json(response);

// Set headers to disable caching
res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
res.headers.set('Pragma', 'no-cache');
res.headers.set('Expires', '0');
    
    return res;
  } catch (error: Error | unknown) {
    // If you need to access properties like error.message, use type guards:
    if (error instanceof Error) {
      // Now you can safely use error.message
      console.error(error.message);
    } else {
      console.error("Unknown error occurred:", error);
    }
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

    // Modified: Only allow ADMIN to create clients
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can create clients" },
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
        gstin: clientData.gstin,
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