import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with your credentials
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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { url, filename } = await req.json();

    if (!url) {
      return new NextResponse("URL is required", { status: 400 });
    }

    // Extract both the resource type and the public ID from the URL
    // Cloudinary URLs look like: https://res.cloudinary.com/cloud-name/resource_type/upload/v1234567/public_id.ext
    let publicId = '';
    let resourceType = 'image'; // Default
    const cloudinaryPrefix = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
    
    if (url.startsWith(cloudinaryPrefix)) {
      // Extract resource type from URL (this is key!)
      const withoutPrefix = url.replace(cloudinaryPrefix, '');
      const parts = withoutPrefix.split('/');
      
      if (parts.length >= 2) {
        // First part is the resource type (image, video, raw)
        resourceType = parts[0];
        
        // Remove the resource type and 'upload' parts
        parts.splice(0, 2);
        
        // The rest is the public ID with potentially a version (v1234)
        let remaining = parts.join('/');
        
        // Remove version if present
        remaining = remaining.replace(/^v\d+\//, '');
        
        // Remove file extension
        publicId = remaining.replace(/\.[^/.]+$/, '');
      }
    }

    console.log(`Using resource type from URL: ${resourceType} for file: ${filename}`);
    console.log("Extracted public ID:", publicId);
    
    // Direct fetch approach - more reliable than generating a URL
    try {
      // Use Cloudinary's secure delivery URL structure
      const secureUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${publicId}.${filename.split('.').pop()}`;
      console.log("Fetching from:", secureUrl);
      
      const response = await fetch(secureUrl);
      
      if (!response.ok) {
        console.error(`Download failed with status: ${response.status}`);
        return new NextResponse(`Failed to fetch file: ${response.statusText}`, { status: response.status });
      }

      // Get the file content
      const fileData = await response.arrayBuffer();
      
      // Return the file with appropriate headers for download
      return new NextResponse(fileData, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': response.headers.get('Content-Length') || '',
        }
      });
      
    } catch (error) {
      console.error("Error fetching file:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new NextResponse(`Error fetching file: ${errorMessage}`, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("Download API error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Internal Server Error: ${errorMessage}`, { status: 500 });
  }
}