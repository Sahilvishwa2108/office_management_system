"use client";

import { useState } from "react";
import CryptoJS from "crypto-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CloudinaryUploadProps {
  taskId?: string;
  onUploadComplete: (attachment: { 
    url: string; 
    secure_url: string; 
    public_id: string; 
    format: string;
    resource_type: string;
    original_filename: string; 
    size: number;
  }) => void;
  disabled?: boolean;
}

export function CloudinaryUpload({ taskId, onUploadComplete, disabled = false }: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    if (!taskId) {
      toast.error("Task ID is missing. Cannot upload file.");
      return;
    }
  
    setUploading(true);
    setUploadProgress(0);
  
    const formData = new FormData();
    const timestamp = Math.floor(Date.now() / 1000); // Current timestamp
    const folder = `office_management/task`;
    const apiKey = process.env.CLOUDINARY_API_KEY || "856333556323653";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "PntG4lFTeOS3QD8w_oUdggqOOrI";
  
    // Generate the signature
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = CryptoJS.SHA1(signatureString).toString(); // Use crypto-js for hashing
  
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("folder", folder);
    formData.append("signature", signature);
    formData.append("taskId", taskId);
  
    // Determine resource type based on file type
    const isImage = file.type.startsWith("image/");
    const resourceType = isImage ? "image" : "raw";
  
    try {
      const xhr = new XMLHttpRequest();
  
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };
  
      const uploadPromise = new Promise<{ 
        url: string; 
        secure_url: string; 
        public_id: string; 
        format: string;
        resource_type: string;
        original_filename: string; 
        size: number;
      }>((resolve, reject) => {
        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME || "dar1v71xk"}/${resourceType}/upload`
        );
  
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            console.error("Cloudinary response:", xhr.responseText);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
  
        xhr.onerror = () => reject(new Error("Upload failed"));
  
        xhr.send(formData);
      });
  
      const data = await uploadPromise;
  
      onUploadComplete({
        url: data.url,
        secure_url: data.secure_url,
        public_id: data.public_id,
        format: data.format,
        resource_type: data.resource_type,
        original_filename: data.original_filename || file.name,
        size: file.size,
      });
  
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        onChange={handleFileUpload}
        disabled={uploading || disabled}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={uploading || disabled}
      >
        {uploading ? (
          <>
            <div className="w-full relative">
              <Skeleton className="h-4 w-full" />
              <div 
                className="absolute top-0 left-0 h-4 bg-primary/50 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
              <span className="absolute inset-0 text-xs flex items-center justify-center">
                {uploadProgress}%
              </span>
            </div>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Attach File
          </>
        )}
      </Button>
    </div>
  );
}