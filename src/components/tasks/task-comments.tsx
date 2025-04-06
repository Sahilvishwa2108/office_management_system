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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { Send as SendIcon, Loader2 as SpinnerIcon } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

interface TaskCommentsProps {
  taskId: string;
  comments: Comment[];
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

export function TaskComments({ taskId, comments: initialComments, currentUser }: TaskCommentsProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await axios.post(`/api/tasks/${taskId}/comments`, {
        content: newComment,
      });
      
      setComments([...comments, response.data]);
      setNewComment("");
      toast.success("Comment added");
      
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discussion</CardTitle>
        <CardDescription>
          Add comments or questions about this task
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment list */}
        <div className="space-y-4">
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
                  <div className="mt-1">
                    {comment.content}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Comment form */}
        <div className="pt-4 border-t">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`} />
              <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-20"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddComment} 
                  disabled={isSubmitting || !newComment.trim()}
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
        </div>
      </CardContent>
    </Card>
  );
}