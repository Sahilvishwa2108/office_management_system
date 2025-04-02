"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Icons } from "@/components/ui/icons";

interface ActivityItem {
  id: string;
  type: "user" | "task" | "client" | "document" | "message";
  action: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
  };
  meta?: Record<string, any>;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  emptyMessage?: string;
  loading?: boolean;
}

export function ActivityFeed({
  items,
  emptyMessage = "No recent activity",
  loading = false,
}: ActivityFeedProps) {
  // Get the icon for the activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user":
        return <Icons.user className="h-4 w-4 text-blue-500" />;
      case "task":
        return <Icons.clipboardList className="h-4 w-4 text-green-500" />;
      case "client":
        return <Icons.briefcase className="h-4 w-4 text-amber-500" />;
      case "document":
        return <Icons.fileText className="h-4 w-4 text-purple-500" />;
      case "message":
        return <Icons.message className="h-4 w-4 text-indigo-500" />;
      default:
        return <Icons.info className="h-4 w-4 text-gray-500" />;
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
            <div className="space-y-1 flex-1">
              <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
              <div className="h-3 w-1/3 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Icons.info className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
          <div className="mt-0.5">{getActivityIcon(item.type)}</div>
          <div className="space-y-1">
            <p className="text-sm">{item.action}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}