"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, User, Briefcase, UserCog, 
  PlusCircle, Trash2, Shield 
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
}

export function ActivityFeed({
  fetchUrl = "/api/activities",
  limit = 10,
  loading: initialLoading = false,
  emptyMessage = "No recent activity found",
  viewAllUrl,
  maxHeight = "calc(5 * 72px)", 
  compact = false,
  showUserInfo = true,
  showRoleInfo = false,
  expanded = false,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(initialLoading || true);

  // Fetch activities from unified endpoint
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await axios.get(fetchUrl, { params: { limit } });
        const data = response.data.data || response.data;
        setActivities(data);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, [fetchUrl, limit]);

  // Function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  // Get appropriate icon based on activity type and action
  const getActivityIcon = (type: string, action: string) => {
    // Check for special combinations of type + action first
    if (type === "user" && action === "role_changed") {
      return <UserCog className="h-4 w-4 text-purple-500" />;
    }
    if (type === "user" && action === "created") {
      return <PlusCircle className="h-4 w-4 text-green-500" />;
    }
    if (type === "user" && action === "deleted") {
      return <Trash2 className="h-4 w-4 text-red-500" />;
    }
    if (type === "user" && action === "name_updated") {
      return <User className="h-4 w-4 text-blue-500" />;
    }
    if (type === "user" && action === "phone_updated") {
      return <User className="h-4 w-4 text-blue-500" />;
    }
    
    // Fall back to type-based icons
    switch (type.toLowerCase()) {
      case "user":
        return <User className="h-4 w-4 text-blue-500" />;
      case "client":
        return <Briefcase className="h-4 w-4 text-amber-500" />;
      case "system":
        return <Shield className="h-4 w-4 text-indigo-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Format the activity message intelligently
  const formatActivityMessage = (type: string, action: string, target: string) => {
    // Special cases for common activities
    if (type === "user" && action === "role_changed") {
      return `changed role for ${target}`;
    }
    
    if (type === "user" && action === "created") {
      return `created account for ${target}`;
    }
    
    if (type === "user" && action === "name_updated") {
      return `updated name for ${target}`;
    }
    
    if (type === "user" && action === "phone_updated") {
      return `updated phone number for ${target}`;
    }
    
    if (type === "client" && action === "created") {
      return `created client ${target}`;
    }
    
    // Default formatting
    return `${action} ${target}`;
  };

  // Format timestamp relative to now
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(expanded ? 7 : 4)].map((_, i) => (
          <div key={i} className={`flex items-start ${compact ? "gap-3" : "gap-4"} animate-pulse`}>
            <div className="h-8 w-8 rounded-full bg-muted"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-muted rounded"></div>
              <div className="h-3 w-1/2 bg-muted rounded"></div>
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

  return (
    <ScrollArea className={`rounded-md`} style={{ maxHeight }}>
      <div className="pr-3 space-y-3">
        {displayActivities.map((activity, index) => (
          <div key={activity.id}>
            <div className={`flex items-start ${compact ? "gap-3" : "gap-4"}`}>
              {showUserInfo && activity.user && (
                <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
                  <AvatarImage 
                    src={activity.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${activity.user.name}`} 
                  />
                  <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
                </Avatar>
              )}
              <div className="space-y-1 flex-1">
                <p className={`${compact ? "text-sm" : ""}`}>
                  <span className="font-medium">
                    {activity.user ? activity.user.name : "System"}
                  </span>{" "}
                  {formatActivityMessage(activity.type, activity.action, activity.target)}
                </p>
                <div className="flex items-center gap-2">
                  {getActivityIcon(activity.type, activity.action)}
                  <p className="text-xs text-muted-foreground flex gap-2 items-center">
                    {showRoleInfo && activity.user?.role && (
                      <>
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded-sm">
                          {activity.user.role.replace("_", " ")}
                        </span>
                        <span>•</span>
                      </>
                    )}
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            </div>
            {index < displayActivities.length - 1 && <Separator className="my-3" />}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}