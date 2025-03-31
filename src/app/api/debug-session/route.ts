import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    return NextResponse.json({ 
      error: "Not authenticated",
      authenticated: false
    }, { status: 401 });
  }

  try {
    // Get user from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    return NextResponse.json({
      authenticated: true,
      userId,
      sessionClaims,
      userFromClerk: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        publicMetadata: user.publicMetadata,
        privateMetadata: user.privateMetadata,
        unsafeMetadata: user.unsafeMetadata
      }
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ 
      error: "Error fetching user data",
      authenticated: true,
      userId,
      sessionClaims
    }, { status: 500 });
  }
}