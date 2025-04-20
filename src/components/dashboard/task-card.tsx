import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignee?: {
    id: string;
    name: string;
    image?: string;
  };
  progress?: number;
  compact?: boolean; // New prop for compact view
}

export function TaskCard({
  id,
  title,
  description,
  status,
  priority,
  dueDate,
  assignee,
  progress = 0,
  compact = false // Default to full size
}: TaskCardProps) {
  // Get status display style
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "review":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  // Get priority display style
  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  // Format date for better readability
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return "No due date";
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Check if task is overdue
  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && status.toLowerCase() !== "completed";
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (compact) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="p-3 pb-0">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm line-clamp-1">{title}</CardTitle>
            <Badge className={`${getPriorityStyle(priority)} text-xs`} variant="secondary">
              {priority}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <Badge className={getStatusStyle(status)} variant="secondary">
                {status}
              </Badge>
              <span className={`text-xs ${isOverdue(dueDate) ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                {formatDueDate(dueDate)}
              </span>
            </div>
            
            <div className="space-y-1">
              <Progress value={progress} className="h-1" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-3 pt-0">
          <Button asChild variant="ghost" size="sm" className="w-full h-8 text-xs">
            <Link href={`/dashboard/junior/tasks/${id}`}>View</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base line-clamp-1">{title}</CardTitle>
          <Badge className={getPriorityStyle(priority)}>
            {priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <Badge className={getStatusStyle(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Due:</span>
            <span className={`font-medium ${isOverdue(dueDate) ? "text-red-500" : ""}`}>
              {formatDueDate(dueDate)}
            </span>
          </div>
          
          {assignee && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Assigned to:</span>
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={assignee.image || `https://api.dicebear.com/7.x/initials/svg?seed=${assignee.name}`}
                    alt={assignee.name}
                  />
                  <AvatarFallback className="text-xs">{getInitials(assignee.name)}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{assignee.name}</span>
              </div>
            </div>
          )}
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/dashboard/junior/tasks/${id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}