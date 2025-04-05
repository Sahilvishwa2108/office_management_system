import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redis, pubRedis } from "@/lib/redis";
import { v2 as cloudinary } from "cloudinary";

const CHAT_HISTORY_KEY = "group_chat";

// Configure Cloudinary with your environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { messageId } = await req.json();
    
    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }
    
    // Get all messages
    const messages = await redis.lrange(CHAT_HISTORY_KEY, 0, -1);
    const remainingMessages = [];
    let messageFound = false;
    let deletedMessage = null;
    
    for (const messageStr of messages) {
      const message = JSON.parse(messageStr);
      
      if (message.id === messageId) {
        // Verify user is deleting their own message
        if (message.name !== session.user.name) {
          return NextResponse.json(
            { error: "You can only delete your own messages" },
            { status: 403 }
          );
        }
        
        messageFound = true;
        deletedMessage = message;
      } else {
        remainingMessages.push(messageStr);
      }
    }
    
    if (!messageFound || !deletedMessage) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }
    
    // Delete Cloudinary resources if the message has attachments
    if (deletedMessage.attachments && deletedMessage.attachments.length > 0) {
      // First delete individual files (just in case folder deletion fails)
      for (const attachment of deletedMessage.attachments) {
        if (attachment.publicId) {
          try {
            console.log(`Deleting Cloudinary resource with ID: ${attachment.publicId}`);
            await cloudinary.uploader.destroy(attachment.publicId);
          } catch (cloudinaryError) {
            console.error('Error deleting from Cloudinary:', cloudinaryError);
            // Continue with message deletion even if Cloudinary delete fails
          }
        }
      }
      
      // Then delete the entire folder for this message
      try {
        // The folder path should match what you used in upload route
        const folderPath = `office_management/chat/${messageId}`;
        console.log(`Deleting Cloudinary folder: ${folderPath}`);
        
        // Use Cloudinary Admin API to delete folder
        await cloudinary.api.delete_folder(folderPath);
      } catch (folderDeleteError) {
        console.error('Error deleting Cloudinary folder:', folderDeleteError);
        // Continue with message deletion even if folder deletion fails
      }
    }
    
    // Delete all messages and reinsert the remaining ones
    await redis.del(CHAT_HISTORY_KEY);
    if (remainingMessages.length > 0) {
      await redis.rpush(CHAT_HISTORY_KEY, ...remainingMessages);
    }
    
    // Broadcast deletion
    await pubRedis.publish(
      "chat_messages",
      JSON.stringify({
        id: messageId,
        type: "message_delete",
        deletedBy: session.user.name,
      })
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}