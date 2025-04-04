import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse the form data
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const messageId = formData.get("messageId") as string;
    
    if (!files?.length || !messageId) {
      return NextResponse.json({ error: "No files provided or missing message ID" }, { status: 400 });
    }
    
    // Create a folder path for better organization
    const folderPath = `office_management/chat/${messageId}`;
    
    // Process each file and upload to Cloudinary
    const attachments = await Promise.all(
      files.map(async (file) => {
        try {
          // Generate a unique file ID
          const fileId = uuidv4();
          
          // Convert File to buffer for Cloudinary upload
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          // Get file extension for proper handling
          const fileExt = file.name.split(".").pop() || "";
          
          // Base file name for storage
          const uniqueFileName = `${fileId}.${fileExt}`;
          
          // Upload to Cloudinary using buffer upload
          // Using async/await with promises for better error handling
          const uploadResult = await new Promise<any>((resolve, reject) => {
            // Create a buffer upload stream
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: folderPath,
                public_id: fileId, 
                resource_type: "auto", // Let Cloudinary detect the resource type
                // Optional transformation parameters
                transformation: file.type.startsWith("image/") ? [
                  { quality: "auto" },
                  { fetch_format: "auto" },
                  { dpr: "auto" }
                ] : [],
              },
              (error, result) => {
                if (error) {
                  console.error("Cloudinary upload error:", error);
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );
            
            // Write buffer to stream
            const Readable = require('stream').Readable;
            const readableInstanceStream = new Readable({
              read() {
                this.push(buffer);
                this.push(null);
              }
            });
            
            readableInstanceStream.pipe(uploadStream);
          });
          
          // Determine file type for the frontend
          const type = file.type.startsWith("image/") ? "image" : "document";
          
          // Return attachment metadata
          return {
            id: fileId,
            filename: file.name,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            type,
            size: file.size,
          };
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          throw error; // Re-throw to be caught by the main try/catch
        }
      })
    );
    
    return NextResponse.json({ success: true, attachments });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
};