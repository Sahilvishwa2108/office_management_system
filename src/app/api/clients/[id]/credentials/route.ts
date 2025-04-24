import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth"; 

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const clientId = resolvedParams.id;

  if (!clientId) {
    return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
  }

  try {
    const credentials = await prisma.credential.findMany({
      where: { clientId },
      select: {
        id: true,
        title: true,
        username: true,
        password: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ credentials });
  } catch (error: Error | unknown) {
    // Use type guard for safe access to error properties
    if (error instanceof Error) {
      console.error("Error fetching credentials:", error.message);
    } else {
      console.error("Unknown error fetching credentials:", error);
    }
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
  }
}

// Update the POST handler as well to match the correct params structure
export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const clientId = resolvedParams.id;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Allow both ADMIN and PARTNER to add credentials
  if (!["ADMIN", "PARTNER"].includes(session.user.role)) {
    return NextResponse.json(
      { error: "Only administrators and partners can add credentials" },
      { status: 403 }
    );
  }

  const body = await request.json();
  
  // Only title and password are mandatory
  if (!body.title || !body.password) {
    return NextResponse.json({ error: "Title and Password are required" }, { status: 400 });
  }

  try {
    const newCredential = await prisma.credential.create({
      data: {
        title: body.title,
        username: body.username || "",
        password: body.password,
        clientId,
      },
    });

    return NextResponse.json({
      id: newCredential.id,
      title: newCredential.title,
      username: newCredential.username,
      password: newCredential.password,
      createdAt: newCredential.createdAt,
      updatedAt: newCredential.updatedAt
    });
  } catch (error: Error | unknown) {
    // Use type guard for safe access to error properties
    if (error instanceof Error) {
      console.error("Error adding credential:", error.message);
    } else {
      console.error("Unknown error adding credential:", error);
    }
    return NextResponse.json({ error: "Failed to add credential" }, { status: 500 });
  }
}

function getServerSession(authOptions: any): Promise<Session | null> {
  return nextAuthGetServerSession(authOptions);
}
