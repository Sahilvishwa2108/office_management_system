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
    role?: string;
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
  showDetails?: boolean;
  className?: string;
}

export function TaskAssignees({
  assignees,
  legacyAssignedTo,
  limit = 3,
  size = "md",
  showTooltip = true,
  showDetails = false,
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
  
  // Format role to be more readable
  const formatRole = (role: string): string => {
    return role?.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
  
  // If showing details, use a different layout
  if (showDetails) {
    const allAssignees = assignees || 
      (legacyAssignedTo ? [{ userId: legacyAssignedTo.id, user: legacyAssignedTo as any }] : []);
    
    return (
      <div className={cn("space-y-2", className)}>
        {allAssignees.map((assignee) => (
          <div key={assignee.userId} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
            <Avatar className={avatarSizes[size]}>
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignee.user.name}`} />
              <AvatarFallback>{getInitials(assignee.user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{assignee.user.name}</div>
              <div className="text-xs text-muted-foreground">{formatRole(assignee.user.role || "")}</div>
            </div>
          </div>
        ))}
      </div>
    );
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
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignee.user.name}`} />
                  <AvatarFallback>{getInitials(assignee.user.name)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              {showTooltip && (
                <TooltipContent>
                  <p>{assignee.user.name}</p>
                  {assignee.user.role && (
                    <p className="text-xs text-muted-foreground">{formatRole(assignee.user.role)}</p>
                  )}
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
        <Avatar className={avatarSizes[size]}>
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${legacyAssignedTo.name}`} />
          <AvatarFallback>{getInitials(legacyAssignedTo.name)}</AvatarFallback>
        </Avatar>
        {showDetails && (
          <div>
            <div className="font-medium">{legacyAssignedTo.name}</div>
            {legacyAssignedTo.role && (
              <div className="text-xs text-muted-foreground">{formatRole(legacyAssignedTo.role)}</div>
            )}
          </div>
        )}
        {!showDetails && <div className="text-sm">{legacyAssignedTo.name}</div>}
      </div>
    );
  }
  
  // This should never happen, but just in case
  return <div className="text-sm text-muted-foreground">Unassigned</div>;
}