import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, we still return success to prevent email fishing
    // But we don't actually send an email
    if (!user) {
      return NextResponse.json(
        { message: "Password reset email sent if account exists" },
        { status: 200 }
      );
    }

    // Generate a password reset token
    const resetToken = uuidv4();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours

    // Save the token to the user's record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetTokenExpiry: tokenExpiry,
      },
    });

    // Send the password reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken, user.id);

    return NextResponse.json(
      { message: "Password reset email sent if account exists" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in forgot password endpoint:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}