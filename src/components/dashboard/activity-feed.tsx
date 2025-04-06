"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { 
  User, FileText, MessagesSquare, CheckCircle, Clock, AlertCircle,
  LogIn, LogOut, UserCog, Trash2, PlusCircle, Briefcase, ClipboardList
} from "lucide-react";

interface ActivityUser {
  id?: string;
  name: string;
  role?: string;
  avatar?: string;
}

interface Activity {
  id: string;
  type: string;
  action: string;
  target: string;
  timestamp: string;
  user?: ActivityUser;
}

interface ActivityFeedProps {
  activities?: Activity[];
  fetchUrl?: string;
  limit?: number;
  loading?: boolean;
  emptyMessage?: string;
  viewAllUrl?: string;
  maxHeight?: string | number;
  compact?: boolean;
  showUserInfo?: boolean;
  showRoleInfo?: boolean;
  expanded?: boolean;
  currentUserMode?: boolean;
  onFetchCompleted?: (data: Activity[]) => void;
}

export function ActivityFeed({
  activities: initialActivities,
  fetchUrl,
  limit = 10,
  loading: initialLoading = false,
  emptyMessage = "No recent activity found",
  viewAllUrl,
  maxHeight = "calc(5 * 72px)", // Height for 5 activities (approximately)
  compact = false,
  showUserInfo = true,
  showRoleInfo = false,
  expanded = false,
  currentUserMode = false,
  onFetchCompleted
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities || []);
  const [loading, setLoading] = useState(initialLoading || Boolean(fetchUrl));

  // Fetch activities if URL is provided
  useEffect(() => {
    if (fetchUrl) {
      const fetchActivities = async () => {
        try {
          setLoading(true);
          const response = await axios.get(fetchUrl, { params: { limit } });
          const data = response.data.data || response.data;
          setActivities(data);
          if (onFetchCompleted) onFetchCompleted(data);
        } catch (error) {
          console.error("Error fetching activities:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchActivities();
    }
  }, [fetchUrl, limit, onFetchCompleted]);

  // Function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  // Enhanced function to get appropriate icon based on activity type AND action
  const getActivityIcon = (type: string, action: string) => {
    // // Check for special combinations of type + action first
    // if (type === "user" && action === "login") {
    //   return <LogIn className="h-4 w-4 text-blue-500" />;
    // }
    // if (type === "user" && action === "logout") {
    //   return <LogOut className="h-4 w-4 text-blue-500" />;
    // }
    if (type === "user" && action === "role_changed") {
      return <UserCog className="h-4 w-4 text-purple-500" />;
    }
    if (type === "user" && action === "created") {
      return <PlusCircle className="h-4 w-4 text-green-500" />;
    }
    if (type === "user" && action === "deleted") {
      return <Trash2 className="h-4 w-4 text-red-500" />;
    }
    
    // Fall back to type-based icons
    switch (type.toLowerCase()) {
      case "user":
        return <User className="h-4 w-4 text-blue-500" />;
      case "document":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "message":
        return <MessagesSquare className="h-4 w-4 text-purple-500" />;
      case "task":
        return action === "completed" 
          ? <CheckCircle className="h-4 w-4 text-emerald-500" />
          : <ClipboardList className="h-4 w-4 text-amber-500" />;
      case "client":
        return <Briefcase className="h-4 w-4 text-amber-500" />;
      case "deadline":
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Format the activity message intelligently
  const formatActivityMessage = (type: string, action: string, target: string) => {
    // Special cases for more readable messages
    if (type === "user" && action === "role_changed") {
      return `changed role for ${target}`;
    }
    
    if (type === "task" && action === "assigned") {
      return `assigned ${target}`;
    }
    
    // if (type === "user" && (action === "login" || action === "logout")) {
    //   return action === "login" ? "logged in" : "logged out";
    // }
    
    // Default formatting
    return `${action} ${target}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    
    if (expanded) {
      return date.toLocaleString();
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(expanded ? 7 : 4)].map((_, i) => (
          <div key={i} className={`flex items-start ${compact ? "gap-3" : "gap-4"} animate-pulse`}>
            {showUserInfo && !currentUserMode && (
              <div className={`${compact ? "h-8 w-8" : "h-10 w-10"} rounded-full bg-muted`}></div>
            )}
            {currentUserMode && (
              <div className="mt-1 h-4 w-4 rounded-full bg-muted"></div>
            )}
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-muted rounded"></div>
              <div className="h-3 w-1/3 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground opacity-20 mb-2" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const displayActivities = expanded ? activities : activities.slice(0, limit);

  const content = (
    <div className="space-y-3">
      {displayActivities.map((activity, index) => (
        <div key={activity.id}>
          <div className={`flex items-start ${compact ? "gap-3" : "gap-4"}`}>
            {showUserInfo && !currentUserMode && activity.user && (
              <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
                <AvatarImage 
                  src={activity.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${activity.user.name}`} 
                  alt={activity.user.name} 
                />
                <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
              </Avatar>
            )}
            {currentUserMode && (
              <div className="mt-1">
                {getActivityIcon(activity.type, activity.action)}
              </div>
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                {showUserInfo && !currentUserMode ? (
                  <TooltipProvider>
                    <div className="flex items-center gap-2">
                      <p className={`${compact ? "text-xs" : "text-sm"} font-medium leading-none`}>
                        {activity.user?.name}
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground cursor-help">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {new Date(activity.timestamp).toLocaleString()}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                ) : (
                  <>
                    <p className={`${compact ? "text-xs" : "text-sm"}`}>
                      {currentUserMode ? <span className="font-medium">You</span> : ""}
                      {" "}{formatActivityMessage(activity.type, activity.action, activity.target)}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </>
                )}
              </div>
              
              {showUserInfo && !currentUserMode && (
                <p className={`${compact ? "text-xs" : "text-sm"} text-muted-foreground`}>
                  <span className="flex items-center gap-1">
                    {getActivityIcon(activity.type, activity.action)}
                    <span>
                      {formatActivityMessage(activity.type, activity.action, activity.target)}
                    </span>
                  </span>
                </p>
              )}
              
              {showRoleInfo && activity.user?.role && (
                <p className="text-xs text-muted-foreground">{activity.user.role}</p>
              )}
              
              {expanded && currentUserMode && (
                <p className="text-xs text-muted-foreground">
                  Activity type: {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                </p>
              )}
            </div>
          </div>
          {currentUserMode && index < displayActivities.length - 1 && <Separator className="my-3" />}
        </div>
      ))}
      
      {!expanded && !viewAllUrl && activities.length > limit && (
        <div className="pt-2 text-center">
          <p className="text-xs text-muted-foreground">
            + {activities.length - limit} more activities
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="activity-feed-container">
      <ScrollArea className="h-[calc(5*72px)] rounded-md">
        <div className="pr-2">
          {content}
        </div>
      </ScrollArea>
    </div>
  );
}