"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Define notification types
export interface Notification {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string | Date;
  sentById?: string;
  sentByName?: string;
  type?: "info" | "success" | "warning" | "error";
  taskId?: string;
}

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

// Create context
const NotificationContext = createContext<NotificationContextProps>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  refreshNotifications: async () => {},
});

// Hook for consuming the notification context
export const useNotifications = () => useContext(NotificationContext);

// Provider component
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(0);
  const router = useRouter();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fetch notifications - stabilize with useCallback
  const fetchNotifications = useCallback(async (): Promise<void> => {
    // Prevent multiple near-simultaneous fetches (debounce-like behavior)
    const now = Date.now();
    if (now - lastFetched < 5000) {
      return; // Skip if less than 5 seconds since last fetch
    }
    
    try {
      setLoading(true);
      setError(null);
      setLastFetched(now);
      
      const response = await axios.get("/api/notifications");
      const data = response.data as { data: Notification[] };
      setNotifications(data.data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Failed to load notifications");

      // Check if it's a network error (which happens when role changes)
      if (axios.isAxiosError(err) && !err.response) {
        // Network error occurred, redirect to login page
        toast.error("Your session has expired. Please login again.");
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [lastFetched, router]); // Only depends on lastFetched

  // Mark a notification as read - stabilized with useCallback
  const markAsRead = useCallback(async (id: string) => {
    try {
      await axios.patch(`/api/notifications/${id}`, { isRead: true });
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      toast.error("Failed to mark notification as read");
    }
  }, []);

  // Clear all notifications - stabilized with useCallback
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.delete("/api/notifications");
      setNotifications([]); // Clear all notifications
      toast.success("All notifications cleared");
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      toast.error("Failed to clear notifications");
    }
  }, []);

  // Delete a notification - stabilized with useCallback
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(prev =>
        prev.filter(notification => notification.id !== id)
      );
      toast.success("Notification deleted");
    } catch (err) {
      console.error("Failed to delete notification:", err);
      toast.error("Failed to delete notification");
    }
  }, []);

  // Initial fetch and polling setup
  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [fetchNotifications]); // Safe to include the memoized function

  // Create a stable context value
  const contextValue = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Notification bell component for UI display
export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  // Get icon for notification type
  const getNotificationIcon = (type?: string) => {
    switch(type) {
      case 'success': return "✅";
      case 'warning': return "⚠️";
      case 'error': return "❌";
      default: return "ℹ️";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.taskId) {
      router.push(`/dashboard/tasks/${notification.taskId}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end">
        <div className="p-3 border-b flex justify-between items-center">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="text-xs h-7"
            >
              Clear all
            </Button>
          )}
        </div>
        <ScrollArea className="h-[320px]">
          {loading ? (
            <div className="p-4">
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center">
              <Bell className="mx-auto h-6 w-6 text-muted-foreground opacity-50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                    !notification.isRead ? "bg-muted/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-2">
                    <div className="mt-0.5 text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="font-medium text-sm">
                        {notification.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {notification.content}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(notification.createdAt), 
                          { addSuffix: true }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Link href="/dashboard/settings/notifications">
              <Button variant="ghost" className="w-full text-xs">
                View all notifications
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}