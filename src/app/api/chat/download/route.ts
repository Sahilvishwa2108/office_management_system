import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from 'stream';

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

    if (!files?.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Process each file and upload to Cloudinary
    const attachments = await Promise.all(
      files.map(async (file) => {
        try {
          // Generate a unique file ID
          const fileId = uuidv4();

          // Convert File to buffer for Cloudinary upload
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Get file extension and MIME type
          const fileExt = file.name.split(".").pop() || "";
          const mimeType = file.type || "application/octet-stream";
          console.log(`Uploading file: ${file.name}, Type: ${mimeType}, Extension: ${fileExt}`);

          // Determine resource type based on file type
          const resourceType = mimeType.startsWith("image/")
            ? "image"
            : "raw"; // Use "raw" for non-image files like PDFs

          // Upload to Cloudinary using buffer upload
          type CloudinaryUploadResult = {
            secure_url: string;
            public_id: string;
            resource_type: string;
          };

          const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "office_management/chat", // Updated folder path
                public_id: fileId,
                resource_type: resourceType, // Explicitly set resource type
              },
              (error, result) => {
                if (error) {
                  console.error("Cloudinary upload error:", error);
                  reject(error);
                } else if (result) {
                  resolve(result as CloudinaryUploadResult);
                } else {
                  reject(new Error("Upload failed: No result returned"));
                }
              }
            );

            // Write buffer to stream
            const readableInstanceStream = new Readable({
              read() {
                this.push(buffer);
                this.push(null);
              },
            });

            readableInstanceStream.pipe(uploadStream);
          });

          console.log("Upload successful:", uploadResult);

          // Determine file type for the frontend
          const type = mimeType.startsWith("image/") ? "image" : "document";

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
          throw error;
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
    responseLimit: "50mb",
  },
};