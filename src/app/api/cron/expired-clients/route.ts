import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Check for API key for security
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current date
    const now = new Date();
    
    // Find all guest clients with expired access
    const expiredClients = await prisma.client.findMany({
      where: {
        isGuest: true,
        accessExpiry: {
          lt: now
        }
      },
      include: {
        tasks: true,
        attachments: true
      }
    });
    
    if (expiredClients.length === 0) {
      return NextResponse.json({ message: 'No expired clients found' });
    }
    
    // Process each expired client
    const results = await Promise.all(
      expiredClients.map(async (client) => {
        try {
          // Log the deletion as an activity (before the client is deleted)
          await prisma.activity.create({
            data: {
              type: "client",
              action: "auto_deleted",
              target: `Guest client: ${client.contactPerson} (expired)`,
              userId: client.managerId, // Use the manager ID as the user who "performed" this action
              details: {
                reason: "access_expired",
                expiredOn: client.accessExpiry,
                clientEmail: client.email,
                clientPhone: client.phone
              }
            },
          });
          
          // Delete the client (cascading deletes for tasks, attachments, etc.)
          await prisma.client.delete({
            where: { id: client.id }
          });
          
          return { id: client.id, name: client.contactPerson, success: true };
        } catch (err) {
          console.error(`Failed to delete expired client ${client.id}:`, err);
          return { id: client.id, name: client.contactPerson, success: false, error: err };
        }
      })
    );
    
    return NextResponse.json({
      message: `Processed ${expiredClients.length} expired guest clients`,
      deletedCount: results.filter(r => r.success).length,
      results
    });
    
  } catch (error) {
    console.error("Error processing expired guest clients:", error);
    return NextResponse.json(
      { error: "Failed to process expired guest clients" },
      { status: 500 }
    );
  }
}