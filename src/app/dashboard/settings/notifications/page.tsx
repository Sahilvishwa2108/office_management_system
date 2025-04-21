"use client";

import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bell, Info } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sentByName?: string;
}

function NotificationsContent() {
  useSession();
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // Load recent notifications - limit to 20 in the API call
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const response = await axios.get("/api/notifications?limit=20");
        setRecentNotifications(response.data.data);
      } catch (error: unknown) {
        console.error("Failed to load notifications:", error);
        toast.error("Failed to load notifications");
      } finally {
        setNotificationsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Add this function to strip taskIds from content
  const stripTaskIdFromContent = (content: string): string => {
    // Replace all taskId patterns with empty string
    return content
      .replace(/\[taskId:\s*[a-f0-9-]+\]/g, "")
      .replace(/taskId:\s*[a-f0-9-]+/g, "")
      .replace(/\(taskId:\s*[a-f0-9-]+\)/g, "")
      .replace(/Task ID:\s*[a-f0-9-]+/gi, "")
      .trim();
  };

  return (
    <div className="grid gap-6">
      {/* Recent Notifications */}
      <Card className="lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Your most recent notifications (maximum 20)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {notificationsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 p-3 border rounded-md">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="space-y-2 flex-grow">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentNotifications.length > 0 ? (
            <div className="space-y-4 overflow-y-auto max-h-[40vh] pr-2">
              {recentNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`flex gap-3 p-3 border rounded-md ${!notification.isRead ? 'bg-muted/30' : ''}`}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.isRead && (
                        <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.title === "New Task Assigned" ||
                       notification.title === "Task Status Updated" ||
                       notification.title === "New Comment on Task"
                        ? stripTaskIdFromContent(notification.content)
                        : notification.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(notification.createdAt)}
                      {notification.sentByName && ` · From: ${notification.sentByName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground">No notifications to display</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <div className="grid gap-6">
        <Card>
          <Skeleton className="h-6 w-48 m-6" />
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </Card>
      </div>
    }>
      <NotificationsContent />
    </Suspense>
  );
}