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
    avatar?: string;
  }
}

// Update the interface to properly type legacyAssignedTo
interface TaskAssigneesProps {
  assignees: TaskAssignee[] | undefined;
  legacyAssignedTo?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    avatar?: string;
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
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Size classes mapping
  const avatarSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  // Handle case when no assignees exist but legacyAssignedTo is present
  if ((!assignees || assignees.length === 0) && legacyAssignedTo) {
    // Convert legacy single assignee to format expected by the component
    const legacyAssignee = {
      userId: legacyAssignedTo.id,
      user: {
        id: legacyAssignedTo.id,
        name: legacyAssignedTo.name,
        email: legacyAssignedTo.email,
        role: legacyAssignedTo.role,
        avatar: legacyAssignedTo.avatar
      }
    };
    
    // If showing details, use a different layout
    if (showDetails) {
      return (
        <div className={cn("space-y-2", className)}>
          <div key={legacyAssignee.userId} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
            <Avatar className={avatarSizes[size]}>
              <AvatarImage src={legacyAssignee.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${legacyAssignee.user.name}`} />
              <AvatarFallback>{getInitials(legacyAssignee.user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{legacyAssignee.user.name}</div>
              <div className="text-xs text-muted-foreground">{formatRole(legacyAssignee.user.role || "")}</div>
            </div>
          </div>
        </div>
      );
    }
    
    // Regular display for legacy assignee
    return (
      <div className={cn("flex -space-x-2 overflow-hidden", className)}>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className={cn("border-2 border-background", avatarSizes[size])}>
                <AvatarImage src={legacyAssignee.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${legacyAssignee.user.name}`} />
                <AvatarFallback>{getInitials(legacyAssignee.user.name)}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            {showTooltip && (
              <TooltipContent>
                <p>{legacyAssignee.user.name}</p>
                {legacyAssignee.user.role && (
                  <p className="text-xs text-muted-foreground">{formatRole(legacyAssignee.user.role)}</p>
                )}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Handle case when no assignees exist
  if (!assignees || assignees.length === 0) {
    return <div className="text-sm text-muted-foreground">Unassigned</div>;
  }
  
  // If showing details, use a different layout
  if (showDetails) {
    return (
      <div className={cn("space-y-2", className)}>
        {assignees.map((assignee) => (
          <div key={assignee.userId} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
            <Avatar className={avatarSizes[size]}>
              <AvatarImage src={assignee.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${assignee.user.name}`} />
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
  
  // Regular display for assignees
  const visibleAssignees = assignees.slice(0, limit);
  const hasMore = assignees.length > limit;
  
  return (
    <div className={cn("flex -space-x-2 overflow-hidden", className)}>
      {visibleAssignees.map((assignee) => (
        <TooltipProvider key={assignee.userId} delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className={cn("border-2 border-background", avatarSizes[size])}>
                <AvatarImage src={assignee.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${assignee.user.name}`} />
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