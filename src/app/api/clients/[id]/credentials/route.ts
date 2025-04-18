import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params; // Await the params object
  const clientId = resolvedParams.id;

  if (!clientId) {
    return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
  }

  try {
    const credentials = await prisma.credential.findMany({
      where: { clientId },
    });

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const clientId = params.id;
  const body = await request.json();

  if (!body.key || !body.value) {
    return NextResponse.json({ error: "Key and Value are required" }, { status: 400 });
  }

  try {
    const newCredential = await prisma.credential.create({
      data: {
        key: body.key,
        value: body.value,
        clientId,
      },
    });

    return NextResponse.json(newCredential);
  } catch (error) {
    console.error("Error adding credential:", error);
    return NextResponse.json({ error: "Failed to add credential" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(request.url);
  const credentialId = url.searchParams.get("credentialId");

  if (!credentialId) {
    return NextResponse.json({ error: "Credential ID is required" }, { status: 400 });
  }

  try {
    // Delete the credential from the database
    await prisma.credential.delete({
      where: { id: credentialId },
    });

    return NextResponse.json({ message: "Credential deleted successfully" });
  } catch (error) {
    console.error("Error deleting credential:", error);
    return NextResponse.json({ error: "Failed to delete credential" }, { status: 500 });
  }
}