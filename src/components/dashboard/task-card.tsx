"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  MoreVertical, 
  Calendar,
  MessageSquare,
  Paperclip
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  status: "not-started" | "in-progress" | "review" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  assignedBy?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  comments?: number;
  attachments?: number;
  onStatusChange?: (id: string, status: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function TaskCard({
  id,
  title,
  description,
  status,
  priority,
  dueDate,
  assignedTo,
  assignedBy,
  comments = 0,
  attachments = 0,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
  className,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">In Progress</Badge>;
      case 'review':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">Review</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">Not Started</Badge>;
    }
  };
  
  // Priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high':
        return <Badge variant="destructive" size="sm">High</Badge>;
      case 'medium':
        return <Badge variant="default" size="sm" className="bg-amber-500">Medium</Badge>;
      default:
        return <Badge variant="secondary" size="sm" className="bg-green-500 text-white">Low</Badge>;
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  };
  
  // Check if task is overdue
  const isOverdue = dueDate ? new Date(dueDate) < new Date() && status !== 'completed' : false;
  
  return (
    <Card className={cn("transition-all", className, {
      "border-amber-500 dark:border-amber-600": priority === 'medium',
      "border-red-500 dark:border-red-600": priority === 'high',
      "border-green-500 dark:border-green-600": status === 'completed',
      "border-red-500 dark:border-red-600": isOverdue,
    })}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            {dueDate && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-3 w-3" />
                <span className={cn({
                  "text-red-500 dark:text-red-400 font-medium": isOverdue
                })}>
                  Due {format(new Date(dueDate), 'MMM d, yyyy')}
                  {isOverdue && " (Overdue)"}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {getPriorityBadge(priority)}
            {getStatusBadge(status)}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(id)}>
                    View Details
                  </DropdownMenuItem>
                )}
                {onStatusChange && status !== 'completed' && (
                  <DropdownMenuItem onClick={() => onStatusChange(id, "completed")}>
                    Mark as Completed
                  </DropdownMenuItem>
                )}
                {onStatusChange && status === 'not-started' && (
                  <DropdownMenuItem onClick={() => onStatusChange(id, "in-progress")}>
                    Start Task
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(id)}>
                    Edit Task
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600" 
                    onClick={() => onDelete(id)}
                  >
                    Delete Task
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {expanded ? (
          <p className="text-sm text-muted-foreground">
            {description || "No description provided."}
          </p>
        ) : description ? (
          <p className="text-sm text-muted-foreground truncate">
            {description}
          </p>
        ) : null}
        
        <div className={cn("flex justify-between items-center", {
          "mt-4": description
        })}>
          <div className="flex items-center gap-2 mt-3">
            {assignedTo && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignedTo.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${assignedTo.name}`} />
                  <AvatarFallback>{getInitials(assignedTo.name)}</AvatarFallback>
                </Avatar>
                <div className="text-xs text-muted-foreground">
                  <span className="block -mb-0.5">{assignedTo.name}</span>
                  <span className="block text-[10px]">{assignedTo.role}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {comments > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>{comments}</span>
              </div>
            )}
            {attachments > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3" />
                <span>{attachments}</span>
              </div>
            )}
            {description && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}