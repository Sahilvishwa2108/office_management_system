import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 

// DELETE a specific credential
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; credentialId: string } }
) {
  // Fix: Resolve params if it's a Promise
  const resolvedParams = params instanceof Promise ? await params : params;
  const credentialId = resolvedParams.credentialId;
  // If you need clientId, use it from resolvedParams
  // const clientId = resolvedParams.id;
  
  const session = await nextAuthGetServerSession(authOptions);
  
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
}