"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CloudinaryUploadProps {
  onUploadComplete: (attachment: { 
    url: string; 
    secure_url: string; 
    public_id: string; 
    format: string;
    resource_type: string;
    original_filename: string; 
  }) => void;
  disabled?: boolean;
}

export function CloudinaryUpload({ onUploadComplete, disabled = false }: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.open("POST", 
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'darlvqu7v'}/auto/upload`
        );

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
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