"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/components/notifications/notification-system";
import { Bell, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function RecentNotificationsCard() {
  const { notifications, markAsRead, refreshNotifications, loading, error } = useNotifications();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  const initialLoadRef = useRef(true);

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

  // Get icon based on notification type
  const getNotificationIcon = (type?: string) => {
    switch(type) {
      case 'success': 
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': 
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error': 
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: 
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const handleNotificationClick = (id: string, taskId?: string) => {
    markAsRead(id);
    if (taskId) {
      router.push(`/dashboard/tasks/${taskId}`);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Recent Notifications</CardTitle>
        <Bell className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading && isInitialLoad ? (
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
        ) : notifications.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-3">
                {notifications.slice(0, 6).map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.isRead ? "bg-muted/30" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification.id, notification.taskId)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {!notification.isRead && (
                            <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="pt-3 mt-3 border-t">
              <Link href="/dashboard/settings/notifications">
                <Button variant="outline" size="sm" className="w-full">
                  View All Notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}