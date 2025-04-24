import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

// Upload or update avatar
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { avatar } = await req.json();
    console.log("Avatar URL received:", avatar); // Debugging log

    const userId = session.user.id;

    if (!avatar) {
      return NextResponse.json({ error: "Avatar URL is required" }, { status: 400 });
    }

    // Update the user's avatar in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar },
    });

    console.log("Updated user:", updatedUser);

    return NextResponse.json({ success: true, avatar });
  } catch (error) {
    console.error("Error uploading avatar:", error); // Debugging log
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

// Remove avatar
export async function DELETE(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("Session user ID:", userId);

    // Fetch the user's avatar URL from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!user || !user.avatar) {
      return NextResponse.json({ error: "No avatar to delete" }, { status: 400 });
    }

    const avatarUrl = user.avatar;
    console.log("Avatar URL to delete:", avatarUrl);

    // Extract the public_id from the avatar URL
    const publicIdMatch = avatarUrl.match(/\/office_management\/avatar\/([^/]+)\.[a-z]+$/i);
    const publicId = publicIdMatch ? `office_management/avatar/${publicIdMatch[1]}` : null;

    if (!publicId) {
      console.error("Invalid avatar URL:", avatarUrl);
      return NextResponse.json({ error: "Invalid avatar URL" }, { status: 400 });
    }

    console.log("Extracted public ID:", publicId);

    // Update the user's avatar field in the database
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });
    console.log("Avatar removed from database");

    // Delete the avatar from Cloudinary
    const formData = new URLSearchParams();
    formData.append("public_id", publicId);
    formData.append("resource_type", "image");

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          public_id: publicId,
          api_key: process.env.CLOUDINARY_API_KEY || "",
          timestamp: Math.floor(Date.now() / 1000).toString(),
          signature: crypto
            .createHash("sha256")
            .update(
              `public_id=${publicId}&timestamp=${Math.floor(
                Date.now() / 1000
              )}${process.env.CLOUDINARY_API_SECRET}`
            )
            .digest("hex"),
        }).toString(),
      }
    );

    const responseData = await cloudinaryResponse.json();
    console.log("Cloudinary response:", responseData);

    if (!cloudinaryResponse.ok || responseData.result !== "ok") {
      console.error("Failed to delete avatar from Cloudinary:", responseData);
      return NextResponse.json({ error: "Failed to delete avatar from Cloudinary" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing avatar:", error);
    return NextResponse.json(
      { error: "Failed to remove avatar" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { folder, timestamp } = await req.json();

    if (!folder || !timestamp) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Generate the signature
    const signature = crypto
      .createHash("sha256")
      .update(
        `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`
      )
      .digest("hex");

    return NextResponse.json({
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY, // Pass the API key to the client
      cloudName: process.env.CLOUDINARY_CLOUD_NAME, // Pass the cloud name to the client
    });
  } catch (error) {
    console.error("Error generating signature:", error);
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
  }
}