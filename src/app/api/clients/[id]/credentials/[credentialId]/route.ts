import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth"; 

// DELETE a specific credential
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string, credentialId: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id: clientId, credentialId } = resolvedParams;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Allow only ADMIN to delete credentials
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can delete credentials" }, 
        { status: 403 }
      );
    }
    
    await prisma.credential.delete({
      where: { id: credentialId }
    });
    
    return NextResponse.json({ message: "Credential deleted successfully" });
  } catch (error) {
    console.error("Error deleting credential:", error);
    return NextResponse.json({ error: "Failed to delete credential" }, { status: 500 });
  }
}

function getServerSession(authOptions: any): Promise<Session | null> {
  return nextAuthGetServerSession(authOptions);
}