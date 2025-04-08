"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  Send as SendIcon, 
  Loader2 as SpinnerIcon,
  FileIcon,
  ImageIcon,
  X as XIcon,
  Download as DownloadIcon,
} from "lucide-react";
import { CloudinaryUpload } from "@/components/cloudinary/cloudinary-upload";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Attachment {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  original_filename: string;
  size: number; // Size of the attachment in bytes
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  attachments?: Attachment[];
  user: User;
}

interface TaskCommentsProps {
  taskId: string;
  comments: Comment[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  maxHeight?: string;
}

export function TaskComments({ 
  taskId, 
  comments: initialComments, 
  currentUser,
  maxHeight = "500px"
}: TaskCommentsProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  
  const handleAddComment = async () => {
    if (!newComment.trim() && attachments.length === 0) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await axios.post(`/api/tasks/${taskId}/comments`, {
        content: newComment,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      
      setComments([...comments, response.data]);
      setNewComment("");
      setAttachments([]);
      toast.success("Comment added");
      
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttachmentComplete = (attachment: Attachment) => {
    setAttachments([...attachments, attachment]); 
  };
  
  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const getFileNameFromAttachment = (attachment: Attachment) => {
    return attachment.original_filename || attachment.public_id.split('/').pop() || "file";
  };

  if (commentsLoading) {
    return (
      <div className="space-y-6 pr-4">
        {Array(3).fill(0).map((_, index) => (
          <div key={`comment-skeleton-${index}`} className="flex gap-4 mb-6">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getAttachmentUrl = (attachment: Attachment) => {
    if (attachment.resource_type === "raw") {
      // Add `fl_attachment` transformation for raw files
      return attachment.secure_url.replace("/upload/", "/upload/fl_attachment/");
    }
    return attachment.secure_url;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Discussion</CardTitle>
        <CardDescription>
          Comment and share files related to this task
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] p-6" type="always">
          {/* Comment list */}
          <div className="space-y-6 pr-4">
            {comments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No comments yet. Be the first to add a comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.user.name}`} />
                    <AvatarFallback>{getInitials(comment.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    
                    {comment.content && (
                      <div className="mt-1">
                        {comment.content}
                      </div>
                    )}
                    
                    {/* Display attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {comment.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="border rounded-md p-2 flex items-center gap-2 bg-muted/50 hover:bg-muted transition-colors"
                          >
                            {attachment.resource_type === "image" ? (
                            <div className="flex flex-col gap-1 m-2.5">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-blue-500" />
                                <span className="text-sm truncate max-w-[150px]">
                                  {getFileNameFromAttachment(attachment)}
                                </span>
                              </div>

                              <a 
                                href={getAttachmentUrl(attachment)}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-1"
                              >
                                <div className="w-48 h-48 flex items-center justify-center border rounded-md overflow-hidden">
                                  <img 
                                    src={getAttachmentUrl(attachment)}
                                    alt={getFileNameFromAttachment(attachment)}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              </a>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 w-48 m-2.5">
                              {/* Document Name and Download Icon in the Same Row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileIcon className="h-5 w-5 text-blue-500" />
                                  <span className="text-sm truncate max-w-[150px]">
                                    {getFileNameFromAttachment(attachment)}
                                  </span>
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <a href={getAttachmentUrl(attachment)} target="_blank" rel="noopener noreferrer">
                                      <div className="border border-muted-foreground rounded p-0.5 mr-1 hover:border-primary transition-colors flex items-center justify-center w-6 h-6">
                                      <DownloadIcon className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                    </div>
                                      </a>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Download file</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>

                              {/* Document Type and Size Below */}
                              <div className="text-xs text-muted-foreground mt-1 pl-1">
                              Document
                            </div>
                            </div>
                          )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="p-4">
        {/* Comment form */}
        <div className="flex gap-4 w-full">
          <Avatar className="h-10 w-10 hidden sm:flex">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`} />
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-20 resize-none"
            />
            
            {/* Display pending attachments */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 border rounded px-2 py-1 bg-muted/50 group"
                  >
                    {attachment.resource_type === 'image' ? 
                      <ImageIcon className="h-4 w-4 text-blue-500" /> : 
                      <FileIcon className="h-4 w-4 text-blue-500" />
                    }
                    <span className="text-xs truncate max-w-[100px]">
                      {getFileNameFromAttachment(attachment)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <CloudinaryUpload
                taskId={taskId}
                onUploadComplete={handleAttachmentComplete} 
                disabled={isSubmitting}
              />
              
              <Button
                onClick={handleAddComment}
                disabled={isSubmitting || (!newComment.trim() && attachments.length === 0)}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerIcon className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <SendIcon className="h-4 w-4" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}