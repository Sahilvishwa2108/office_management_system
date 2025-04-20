"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/components/notifications/notification-system";
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  X,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RecentNotificationsCardProps {
  className?: string;
}

// Add this function early in your component
const getClearedNotificationIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('clearedNotificationIds');
  return stored ? JSON.parse(stored) : [];
};

export function RecentNotificationsCard({
  className = "",
}: RecentNotificationsCardProps) {
  const { notifications, markAsRead, refreshNotifications, loading } =
    useNotifications();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [visibleNotifications, setVisibleNotifications] = useState<
    typeof notifications
  >([]);
  const router = useRouter();
  const initialLoadRef = useRef(true);
  const [clearedIds, setClearedIds] = useState<string[]>([]);

  // Load data only once on initial mount
  useEffect(() => {
    // Only run once using ref to prevent excessive API calls
    if (initialLoadRef.current) {
      initialLoadRef.current = false;

      const loadData = async () => {
        await refreshNotifications();
        setIsInitialLoad(false);
      };

      loadData();
    }
  }, []); // Empty dependency array - only run on mount


  useEffect(() => {
    setClearedIds(getClearedNotificationIds());
  }, []);


  // Update visible notifications when actual notifications change
  useEffect(() => {
    const filteredNotifications = notifications.filter(
      notification => !clearedIds.includes(notification.id)
    );
    setVisibleNotifications(filteredNotifications);
  }, [notifications, clearedIds]);

  // Get icon based on notification type
  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const handleNotificationClick = (notification: {
    id: string;
    title: string;
    content: string;
    taskId?: string;
  }) => {
    console.log("Notification clicked:", notification); // Debug log
    console.log("Notification title:", notification.title); // Debug log
    console.log("Task ID:", notification.taskId); // Debug log
    console.log("Full content:", notification.content); // Add this to see the exact content format

    markAsRead(notification.id); // Mark the notification as read

    // Redirect based on the notification title
    // Redirect based on the notification title
    if (notification.title === "New Team Chat Message") {
      console.log("Redirecting to /dashboard/chat");
      router.push("/dashboard/chat");
    } else if (
      notification.title === "Your profile was updated" ||
      notification.title.endsWith("profile")
    ) {
      console.log("Redirecting to /dashboard/settings/profile");
      router.push("/dashboard/settings/profile");
    } else if (
      notification.title === "New Task Assigned" ||
      notification.title === "Task Status Updated" ||
      notification.title === "New Comment on Task" // Add this condition
    ) {
      console.log("Processing task notification");

      // First try to use the direct taskId if available
      let taskId: string | null = notification.taskId || null;

      // If taskId isn't directly available, try to extract from content
      if (!taskId) {
        // Try different regex patterns to match the taskId
        const patterns = [
          /\[taskId:\s*([a-f0-9-]+)\]/, // [taskId: uuid]
          /taskId:\s*([a-f0-9-]+)/, // taskId:uuid
          /\(taskId:\s*([a-f0-9-]+)\)/, // (taskId:uuid)
          /Task ID:\s*([a-f0-9-]+)/i, // Task ID: uuid
        ];

        // Try each pattern until we find a match
        for (const pattern of patterns) {
          const match = notification.content.match(pattern);
          if (match && match[1]) {
            taskId = match[1];
            console.log(
              `Matched pattern: ${pattern}, extracted taskId:`,
              taskId
            );
            break;
          }
        }
      }

      if (taskId) {
        console.log(`Routing to task: /dashboard/tasks/${taskId}`);
        router.push(`/dashboard/tasks/${taskId}`);
      } else {
        console.error(
          "Failed to extract taskId from content:",
          notification.content
        );
      }
    } else {
      console.warn(
        "Unknown notification title or missing taskId:",
        notification
      );
    }
  };

  // Add this function before your return statement
  const stripTaskIdFromContent = (content: string): string => {
    // Replace all taskId patterns with empty string
    return content
      .replace(/\[taskId:\s*[a-f0-9-]+\]/g, "")
      .replace(/taskId:\s*[a-f0-9-]+/g, "")
      .replace(/\(taskId:\s*[a-f0-9-]+\)/g, "")
      .replace(/Task ID:\s*[a-f0-9-]+/gi, "")
      .trim();
  };

  // Clear notifications from view only (not from database)
  // Replace the clearVisibleNotifications function with this:
  const clearVisibleNotifications = useCallback(async () => {
    try {
      // Mark notifications as read in the database
      for (const notification of visibleNotifications) {
        if (!notification.isRead) {
          await markAsRead(notification.id);
        }
      }
      
      // Store the cleared notification IDs in localStorage
      const newClearedIds = [
        ...clearedIds,
        ...visibleNotifications.map(notification => notification.id)
      ];
      localStorage.setItem('clearedNotificationIds', JSON.stringify(newClearedIds));
      setClearedIds(newClearedIds);
      
      // Clear them from view
      setVisibleNotifications([]);
      toast.success("Notifications cleared");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      toast.error("Failed to clear notifications");
    }
  }, [visibleNotifications, clearedIds, markAsRead]);

  return (
    <Card className={`h-full flex flex-col py-0 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pt-4 pb-0 px-4 flex-shrink-0">
        <CardTitle className="text-md">Recent Notifications</CardTitle>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/settings/notifications">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs flex items-center bg-blue-50 hover:bg-blue-100 text-blue-600"
            >
              <span>View all</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-red-100 hover:bg-red-50 hover:text-red-500 transition-colors"
            onClick={clearVisibleNotifications}
            disabled={visibleNotifications.length === 0}
            title="Clear from view"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="bg-amber-50 p-1.5 rounded-full">
            <Bell className="h-5 w-5 text-amber-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0 pt-1">
        {loading && isInitialLoad ? (
          <div className="space-y-3 px-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="text-center py-6 flex-1 flex flex-col items-center justify-center px-4">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 max-h-[calc(100%-36px)]">
              <div className="space-y-2 px-4 py-1">
                {visibleNotifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-2 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.isRead ? "bg-muted/30" : ""
                    }`}
                    onClick={() =>
                      handleNotificationClick({
                        ...notification,
                        content: notification.content || "",
                      })
                    }
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.title)}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <Badge
                              variant="default"
                              className="h-1.5 w-1.5 rounded-full p-0"
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.title === "New Task Assigned" ||
                          notification.title === "Task Status Updated" ||
                          notification.title === "New Comment on Task" // Add this condition
                            ? stripTaskIdFromContent(notification.content)
                            : notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
