import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { v4 as uuidv4 } from "uuid";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

// Function to ensure directory exists
async function ensureDir(dirPath: string) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error("Error creating directory:", error);
  }
}

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
    
    // Create an uploads directory for this conversation
    const uploadDir = path.join(process.cwd(), "public", "uploads", "chat", messageId);
    await ensureDir(uploadDir);
    
    // Process each file
    const attachments = await Promise.all(
      files.map(async (file) => {
        const fileId = uuidv4();
        const fileExt = file.name.split(".").pop() || "";
        const fileName = `${fileId}.${fileExt}`;
        const filePath = path.join(uploadDir, fileName);
        
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Save file to disk
        await writeFile(filePath, buffer);
        
        // Generate URL path
        const url = `/uploads/chat/${messageId}/${fileName}`;
        
        // Determine file type
        const type = file.type.startsWith("image/") ? "image" : "document";
        
        return {
          id: fileId,
          filename: file.name,
          url: url,
          type: type,
          size: file.size,
        };
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
    responseLimit: '50mb',
    bodyParser: false,
  },
};