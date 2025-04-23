"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send as SendIcon,
  Loader2 as SpinnerIcon,
  FileIcon,
  ImageIcon,
  X as XIcon,
  Download as DownloadIcon,
  RefreshCw as RefreshIcon,
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

import { Dialog, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { Eye, Download, ZoomIn, ZoomOut, RotateCw, X } from "lucide-react";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
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
    avatar?: string;
  };
  maxHeight?: string;
}

export function TaskComments({
  taskId,
  comments: initialComments,
  currentUser,
  maxHeight = "500px",
}: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<{
    url: string;
    filename: string;
  } | null>(null);
  const [imageViewerZoom, setImageViewerZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  const openImageViewer = useCallback((url: string, filename: string) => {
    setCurrentImage({ url, filename });
    setImageViewerOpen(true);
    setImageViewerZoom(1);
    setImageRotation(0);
  }, []);

  const fetchLatestComments = useCallback(
    async (showToast = false) => {
      try {
        setRefreshing(true);
        const response = await axios.get(`/api/tasks/${taskId}/comments`);
        setComments(response.data);
        if (showToast) {
          toast.success("Comments refreshed");
        }
      } catch (error) {
        console.error("Error refreshing comments:", error);
        if (showToast) {
          toast.error("Failed to refresh comments");
        }
      } finally {
        setRefreshing(false);
      }
    },
    [taskId]
  );

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      fetchLatestComments();
    }, 300000);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [fetchLatestComments]);

  const handleRefreshComments = () => {
    fetchLatestComments(true);
  };

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
    return (
      attachment.original_filename ||
      attachment.public_id.split("/").pop() ||
      "file"
    );
  };

  const getAttachmentUrl = (attachment: Attachment) => {
    if (attachment.resource_type === "raw") {
      return attachment.secure_url.replace(
        "/upload/",
        "/upload/fl_attachment/"
      );
    }
    return attachment.secure_url;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Task Discussion</CardTitle>
          <CardDescription>
            Comment and share files related to this task
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshComments}
          disabled={refreshing}
          className="ml-auto"
        >
          {refreshing ? (
            <SpinnerIcon className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshIcon className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] p-6" type="always">
          <div style={{ maxHeight }} className="overflow-auto">
            {refreshing ? (
              <div className="space-y-6 pr-4">
                {Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={`comment-skeleton-${index}`}
                      className="flex gap-4 mb-6"
                    >
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
            ) : comments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No comments yet. Be the first to add a comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 mb-6">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={comment.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.user.name}`}
                    />
                    <AvatarFallback>
                      {getInitials(comment.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(comment.createdAt),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                    </div>

                    {comment.content && (
                      <div className="mt-1">{comment.content}</div>
                    )}

                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {comment.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="border rounded-md p-2 flex items-center gap-2 bg-muted/50 hover:bg-muted transition-colors"
                          >
                            {attachment.resource_type === "image" ? (
                              <div className="relative w-48 h-48 group">
                                <Image
                                  src={getAttachmentUrl(attachment)}
                                  alt={getFileNameFromAttachment(attachment)}
                                  width={400}
                                  height={300}
                                  className="object-cover w-full h-full rounded-md"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-white hover:text-primary"
                                    onClick={() =>
                                      openImageViewer(
                                        getAttachmentUrl(attachment),
                                        getFileNameFromAttachment(attachment)
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-white hover:text-primary"
                                    onClick={async () => {
                                      const response = await fetch(
                                        getAttachmentUrl(attachment)
                                      );
                                      const blob = await response.blob();
                                      const downloadUrl =
                                        window.URL.createObjectURL(blob);

                                      const now = new Date();
                                      const formattedDate = `${String(
                                        now.getDate()
                                      ).padStart(2, "0")}-${String(
                                        now.getMonth() + 1
                                      ).padStart(2, "0")}-${now.getFullYear()}`;

                                      const fileExtension =
                                        attachment.format ||
                                        attachment.url.split(".").pop();

                                      const newFileName = `${getFileNameFromAttachment(
                                        attachment
                                      )}_${formattedDate}.${fileExtension}`;

                                      const link =
                                        document.createElement("a");
                                      link.href = downloadUrl;
                                      link.download = newFileName;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);

                                      window.URL.revokeObjectURL(downloadUrl);
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1 w-48 m-2.5">
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
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-muted-foreground hover:text-primary"
                                          onClick={async () => {
                                            const response = await fetch(
                                              getAttachmentUrl(attachment)
                                            );
                                            const blob = await response.blob();
                                            const downloadUrl =
                                              window.URL.createObjectURL(blob);

                                            const now = new Date();
                                            const formattedDate = `${String(
                                              now.getDate()
                                            ).padStart(2, "0")}-${String(
                                              now.getMonth() + 1
                                            ).padStart(2, "0")}-${now.getFullYear()}`;

                                            const fileExtension =
                                              attachment.format ||
                                              attachment.url.split(".").pop();

                                            const newFileName = `${getFileNameFromAttachment(
                                              attachment
                                            )}_${formattedDate}.${fileExtension}`;

                                            const link =
                                              document.createElement("a");
                                            link.href = downloadUrl;
                                            link.download = newFileName;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);

                                            window.URL.revokeObjectURL(
                                              downloadUrl
                                            );
                                          }}
                                        >
                                          <DownloadIcon className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Download file</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>

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

      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
      <DialogContent className="sm:max-w-[80vw] max-h-[90vh] flex flex-col p-0 gap-0 border-none bg-background/70 backdrop-blur-xl hide-default-close-btn">
          <div className="p-4 flex items-center border-b">
            <DialogTitle className="text-sm flex-1 truncate">
              {currentImage?.filename}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() =>
                  setImageViewerZoom((prev) => Math.max(0.5, prev - 0.1))
                }
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() =>
                  setImageViewerZoom((prev) => Math.min(3, prev + 0.1))
                }
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  currentImage && window.open(currentImage.url, "_blank")
                }
              >
                <Download className="h-4 w-4" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setImageViewerOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
            <div
              className="overflow-auto max-w-full max-h-full flex items-center justify-center"
              style={{
                transform: `scale(${imageViewerZoom}) rotate(${imageRotation}deg)`,
                transition: "transform 0.2s ease",
              }}
            >
              {currentImage && (
                <Image
                  src={currentImage.url}
                  alt={currentImage.filename}
                  width={400}
                  height={300}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Separator />

      <CardFooter className="p-4">
        <div className="flex gap-4 w-full">
          <Avatar className="h-10 w-10 hidden sm:flex">
            <AvatarImage
              src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`}
            />
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-20 resize-none"
            />

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 border rounded px-2 py-1 bg-muted/50 group"
                  >
                    {attachment.resource_type === "image" ? (
                      <ImageIcon className="h-4 w-4 text-blue-500" />
                    ) : (
                      <FileIcon className="h-4 w-4 text-blue-500" />
                    )}
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
                disabled={
                  isSubmitting ||
                  (!newComment.trim() && attachments.length === 0)
                }
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
