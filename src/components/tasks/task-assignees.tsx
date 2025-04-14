"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TaskAssignee {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }
}

interface TaskAssigneesProps {
  assignees: TaskAssignee[] | undefined;
  legacyAssignedTo?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
  } | null;
  limit?: number;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

export function TaskAssignees({
  assignees,
  legacyAssignedTo,
  limit = 3,
  size = "md",
  showTooltip = true,
  className,
}: TaskAssigneesProps) {
  // Helper function for initials
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Size classes mapping
  const avatarSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  // Handle case when no assignees exist
  if ((!assignees || assignees.length === 0) && !legacyAssignedTo) {
    return <div className="text-sm text-muted-foreground">Unassigned</div>;
  }
  
  // If we have new-style assignees, show them
  if (assignees && assignees.length > 0) {
    const visibleAssignees = assignees.slice(0, limit);
    const hasMore = assignees.length > limit;
    
    return (
      <div className={cn("flex -space-x-2 overflow-hidden", className)}>
        {visibleAssignees.map((assignee) => (
          <TooltipProvider key={assignee.userId} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className={cn("border-2 border-background", avatarSizes[size])}>
                  <AvatarFallback>{getInitials(assignee.user.name)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              {showTooltip && (
                <TooltipContent>
                  <p>{assignee.user.name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
        
        {hasMore && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center justify-center rounded-full bg-muted text-xs font-medium border-2 border-background",
                  avatarSizes[size]
                )}>
                  +{assignees.length - limit}
                </div>
              </TooltipTrigger>
              {showTooltip && (
                <TooltipContent>
                  <p>{assignees.length - limit} more assignees</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }
  
  // Fallback for legacy data
  if (legacyAssignedTo) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback>{getInitials(legacyAssignedTo.name)}</AvatarFallback>
        </Avatar>
        <div className="text-sm">{legacyAssignedTo.name}</div>
      </div>
    );
  }
  
  // This should never happen, but just in case
  return <div className="text-sm text-muted-foreground">Unassigned</div>;
}