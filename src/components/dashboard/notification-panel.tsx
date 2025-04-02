"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  description?: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: Date;
}

interface NotificationPanelProps {
  notifications?: Notification[];
  loading?: boolean;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onViewAll?: () => void;
}

export function NotificationPanel({
  notifications = [],
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAll,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'success':
        return "✅";
      case 'warning':
        return "⚠️";
      case 'error':
        return "❌";
      default:
        return "ℹ️";
    }
  };
  
  // Notification background color based on type
  const getNotificationBackground = (type: string, read: boolean) => {
    if (read) return "bg-transparent";
    
    switch(type) {
      case 'success':
        return "bg-green-50 dark:bg-green-900/30";
      case 'warning':
        return "bg-amber-50 dark:bg-amber-900/30";
      case 'error':
        return "bg-red-50 dark:bg-red-900/30";
      default:
        return "bg-blue-50 dark:bg-blue-900/30";
    }
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-8"
              onClick={onMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="p-3 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 p-2 rounded-md animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-muted rounded"></div>
                    <div className="h-3 w-1/2 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="py-2">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`flex gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                    getNotificationBackground(notification.type, notification.read)
                  } ${notification.read ? "" : "font-medium"}`}
                  onClick={() => onMarkAsRead?.(notification.id)}
                >
                  <div className="mt-0.5">
                    <span role="img" aria-label={notification.type} className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm">{notification.title}</p>
                    {notification.description && (
                      <p className="text-xs text-muted-foreground">
                        {notification.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
              <Bell className="h-12 w-12 text-muted-foreground mb-2 opacity-20" />
              <h4 className="text-sm font-medium">No notifications</h4>
              <p className="text-xs text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              className="w-full text-center text-sm h-9"
              onClick={onViewAll}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}