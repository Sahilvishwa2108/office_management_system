import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        // Check authentication
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get request data
        const { currentPassword, newPassword, userId } = await req.json();
        
        // Admin can reset any user's password, regular users can only reset their own
        const targetUserId = session.user.role === "ADMIN" && userId ? userId : session.user.id;
        
        // Get the user
        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If not an admin resetting someone else's password, verify current password
        if (!userId || session.user.id === targetUserId) {
            // Check if currentPassword is provided when required
            if (!currentPassword) {
                return NextResponse.json(
                    { error: "Current password is required" },
                    { status: 400 }
                );
            }
            
            // Make sure user.password is not null before comparing
            if (!user.password) {
                return NextResponse.json(
                    { error: "User has no password set" },
                    { status: 400 }
                );
            }

            const passwordMatches = await bcrypt.compare(currentPassword, user.password);
            if (!passwordMatches) {
                return NextResponse.json(
                    { error: "Current password is incorrect" },
                    { status: 400 }
                );
            }
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        await prisma.user.update({
            where: { id: targetUserId },
            data: {
                password: hashedPassword,
                // Clear any reset tokens
                passwordResetToken: null,
                passwordResetTokenExpiry: null,
            },
        });

        return NextResponse.json(
            { message: "Password updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in reset password endpoint:", error);
        return NextResponse.json(
            { error: "An error occurred while processing your request" },
            { status: 500 }
        );
    }
}